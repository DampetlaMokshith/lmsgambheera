import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Validate environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize Stripe only if key exists
let stripe: Stripe | null = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2026-01-28.clover',
  });
}

// Initialize Supabase admin client only if credentials exist
let supabaseAdmin: SupabaseClient | null = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
}

// Helper to get raw body as buffer for Stripe signature verification
async function getRawBody(request: NextRequest): Promise<Buffer> {
  const reader = request.body?.getReader();
  if (!reader) {
    throw new Error('No request body');
  }

  const chunks: Uint8Array[] = [];
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    if (value) {
      chunks.push(value);
    }
    done = readerDone;
  }

  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  console.log('Stripe webhook received');

  // Check if Stripe is initialized
  if (!stripe) {
    console.error('Stripe is not initialized. Check STRIPE_SECRET_KEY.');
    return NextResponse.json(
      { error: 'Stripe configuration error' },
      { status: 500 }
    );
  }

  // Check if Supabase is initialized
  if (!supabaseAdmin) {
    console.error('Supabase is not initialized. Check SUPABASE credentials.');
    return NextResponse.json(
      { error: 'Database configuration error' },
      { status: 500 }
    );
  }

  try {
    // Get raw body as buffer for signature verification
    const rawBody = await getRawBody(request);
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    // Verify the webhook signature
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
      console.log('Webhook signature verified successfully');
    } catch (err) {
      const error = err as Error;
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      );
    }

    console.log(`Processing event type: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent, supabaseAdmin, stripe);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent, supabaseAdmin);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent, supabaseAdmin);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge, supabaseAdmin);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    const err = error as Error;
    console.error('Webhook error:', err.message, err.stack);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: err.message },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(
  paymentIntent: Stripe.PaymentIntent,
  supabase: SupabaseClient,
  stripeClient: Stripe
) {
  console.log('Processing successful payment:', paymentIntent.id);

  const { courseId, courseSanityId, userId } = paymentIntent.metadata;

  if (!userId || !courseSanityId) {
    console.error('Missing required metadata in payment intent:', paymentIntent.metadata);
    return;
  }

  try {
    // Get receipt URL if charge exists
    let receiptUrl: string | null = null;
    if (paymentIntent.latest_charge) {
      try {
        const charge = await stripeClient.charges.retrieve(paymentIntent.latest_charge as string);
        receiptUrl = charge.receipt_url || null;
      } catch (e) {
        console.error('Error fetching receipt URL:', e);
      }
    }

    // Update payment status in Supabase
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        payment_method: paymentIntent.payment_method as string,
        completed_at: new Date().toISOString(),
        metadata: {
          ...paymentIntent.metadata,
          completed_at: new Date().toISOString(),
          receipt_url: receiptUrl,
        },
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
    } else {
      console.log('Payment status updated to succeeded');
    }

    // Enroll the user in the course
    await enrollUserInCourse(supabase, userId, courseSanityId, courseId || courseSanityId, paymentIntent.id);

    console.log(`User ${userId} successfully enrolled in course ${courseSanityId}`);
  } catch (error) {
    console.error('Error processing payment success:', error);
  }
}

async function handlePaymentFailure(
  paymentIntent: Stripe.PaymentIntent,
  supabase: SupabaseClient
) {
  console.log('Processing failed payment:', paymentIntent.id);

  try {
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        metadata: {
          ...paymentIntent.metadata,
          failure_reason: paymentIntent.last_payment_error?.message || 'Unknown error',
          failed_at: new Date().toISOString(),
        },
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
    }
  } catch (error) {
    console.error('Error processing payment failure:', error);
  }
}

async function handlePaymentCanceled(
  paymentIntent: Stripe.PaymentIntent,
  supabase: SupabaseClient
) {
  console.log('Processing canceled payment:', paymentIntent.id);

  try {
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        metadata: {
          ...paymentIntent.metadata,
          cancelled_at: new Date().toISOString(),
        },
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
    }
  } catch (error) {
    console.error('Error processing payment cancellation:', error);
  }
}

async function handleRefund(
  charge: Stripe.Charge,
  supabase: SupabaseClient
) {
  console.log('Processing refund for charge:', charge.id);

  try {
    const paymentIntentId = charge.payment_intent as string;

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        metadata: {
          refunded_at: new Date().toISOString(),
          refund_amount: charge.amount_refunded,
        },
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (updateError) {
      console.error('Error updating refund status:', updateError);
    }
  } catch (error) {
    console.error('Error processing refund:', error);
  }
}

async function enrollUserInCourse(
  supabase: SupabaseClient,
  userId: string,
  courseSanityId: string,
  courseId: string,
  paymentIntentId: string
) {
  try {
    // First, get the Supabase course UUID from the sanity_id
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('sanity_id', courseSanityId)
      .single();

    if (courseError || !courseData) {
      console.error('Course not found in Supabase:', courseSanityId, courseError);
      // Try with courseId as fallback
      const { data: fallbackCourse, error: fallbackError } = await supabase
        .from('courses')
        .select('id')
        .eq('id', courseId)
        .single();
      
      if (fallbackError || !fallbackCourse) {
        console.error('Course not found with fallback either:', courseId);
        throw new Error('Course not found in database');
      }
    }

    const supabaseCourseId = courseData?.id || courseId;

    // Check if enrollment already exists
    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', supabaseCourseId)
      .maybeSingle();

    if (existingEnrollment) {
      console.log(`User ${userId} already enrolled in course ${courseSanityId}`);
      return;
    }

    // Get user details for the enrollment record
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', userId)
      .single();
    
    // Get user email from users table
    const { data: userRecord } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    // Create new enrollment with correct schema
    const { error: insertError } = await supabase
      .from('course_enrollments')
      .insert({
        user_id: userId,
        course_id: supabaseCourseId,
        enrolled_at: new Date().toISOString(),
        status: 'active',
        progress: 0,
        user_name: userData?.full_name || null,
        user_email: userRecord?.email || null,
      });

    if (insertError) {
      // Handle duplicate enrollment gracefully
      if (insertError.code === '23505') {
        console.log(`User ${userId} already enrolled (duplicate key)`);
        return;
      }
      console.error('Error creating enrollment:', insertError);
      throw insertError;
    }

    console.log(`Successfully enrolled user ${userId} in course ${courseSanityId} (UUID: ${supabaseCourseId})`);
  } catch (error) {
    console.error('Error enrolling user:', error);
    throw error;
  }
}

// Export GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Stripe webhook endpoint is active',
    stripeConfigured: !!stripe,
    supabaseConfigured: !!supabaseAdmin,
    webhookSecretConfigured: !!webhookSecret,
  });
}
