import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

// Initialize Supabase client with service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, courseSanityId, courseTitle, amount, currency = 'inr', userId, userEmail } = body;

    // Validate required fields
    if (!courseId || !courseSanityId || !courseTitle || amount === undefined || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, courseSanityId, courseTitle, amount, userId' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount < 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be non-negative.' },
        { status: 400 }
      );
    }

    // For free courses, skip Stripe and directly return success
    if (amount === 0) {
      return NextResponse.json({
        success: true,
        isFree: true,
        message: 'Course is free. No payment required.',
      });
    }

    // Convert amount to smallest currency unit (paise for INR)
    const amountInSmallestUnit = Math.round(amount * 100);

    // Check if user already has a successful payment for this course
    const { data: existingPayment, error: checkError } = await supabaseAdmin
      .from('payments')
      .select('id, status')
      .eq('user_id', userId)
      .eq('course_sanity_id', courseSanityId)
      .eq('status', 'succeeded')
      .single();

    if (existingPayment && !checkError) {
      // User already paid - return success so they can access the course
      return NextResponse.json({
        success: true,
        alreadyPurchased: true,
        message: 'You already have access to this course.',
      });
    }

    // Look up or create a Stripe customer
    let customerId: string | undefined;
    
    if (userEmail) {
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            supabase_user_id: userId,
          },
        });
        customerId = customer.id;
      }
    }

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata: {
        courseId,
        courseSanityId,
        courseTitle,
        userId,
        userEmail: userEmail || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Course enrollment: ${courseTitle}`,
      receipt_email: userEmail,
    });

    // Create a pending payment record in Supabase
    const { error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        course_id: courseId,
        course_sanity_id: courseSanityId,
        course_title: courseTitle,
        amount: amountInSmallestUnit,
        currency: currency.toLowerCase(),
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: customerId,
        status: 'pending',
        receipt_email: userEmail,
        metadata: {
          created_at: new Date().toISOString(),
        },
      });

    if (insertError) {
      console.error('Error creating payment record:', insertError);
      // Don't fail the request, continue with the payment intent
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while processing your payment request.' },
      { status: 500 }
    );
  }
}

// GET endpoint to check payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');
    const userId = searchParams.get('userId');
    const courseSanityId = searchParams.get('courseSanityId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // If checking for a specific payment intent
    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return NextResponse.json({
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      });
    }

    // If checking if user has paid for a specific course
    if (courseSanityId) {
      const { data: payment, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .eq('course_sanity_id', courseSanityId)
        .eq('status', 'succeeded')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking payment:', error);
        return NextResponse.json(
          { error: 'Error checking payment status' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        hasPaid: !!payment,
        payment: payment || null,
      });
    }

    return NextResponse.json(
      { error: 'Either paymentIntentId or courseSanityId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'An error occurred while checking payment status.' },
      { status: 500 }
    );
  }
}
