'use client';

import React, { useState, useEffect } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { getStripe, formatPrice } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, AlertCircle, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface CheckoutFormProps {
  courseTitle: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ courseTitle, amount, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/courses`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        toast.error(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful! Enrolling you in the course...');
        onSuccess();
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        toast.info('Payment is processing. You will be notified once it completes.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      toast.error('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-black p-5 border border-white/10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/60 text-sm uppercase tracking-wider">Course</span>
          <span className="text-white font-medium truncate max-w-[200px]">{courseTitle}</span>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-white/10">
          <span className="text-white/60 text-sm uppercase tracking-wider">Total</span>
          <span className="text-3xl font-bold text-white">{formatPrice(amount)}</span>
        </div>
      </div>

      <div className="bg-black p-5 border border-white/10">
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                address: {
                  country: 'IN',
                },
              },
            },
          }}
        />
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-4 border border-red-500/20">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-white/40 text-xs py-2">
        <Lock className="w-3 h-3" />
        <span>Secured by Stripe</span>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 rounded-none border-white/20 text-white hover:bg-white/5 hover:border-white/40 transition-colors"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="flex-1 rounded-none bg-white text-black hover:bg-white/90 transition-colors font-medium"
        >
          {isProcessing ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Processing...
            </>
          ) : (
            <>
              Pay {formatPrice(amount)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseSanityId: string;
  courseTitle: string;
  amount: number;
  userId: string;
  userEmail?: string;
  onPaymentSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  courseId,
  courseSanityId,
  courseTitle,
  amount,
  userId,
  userEmail,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && amount > 0) {
      createPaymentIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, amount]);

  const createPaymentIntent = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          courseSanityId,
          courseTitle,
          amount,
          currency: 'inr',
          userId,
          userEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      if (data.isFree || data.alreadyPurchased) {
        // Handle free course or already purchased - go straight to success
        if (data.alreadyPurchased) {
          toast.success('You already have access to this course!');
        }
        setPaymentSuccess(true);
        setTimeout(() => {
          onPaymentSuccess();
        }, 1500);
        return;
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
      toast.error('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      onPaymentSuccess();
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    if (!loading) {
      setClientSecret(null);
      setError(null);
      setPaymentSuccess(false);
      onClose();
    }
  };

  const stripePromise = getStripe();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-black border border-white/10 max-w-md rounded-none p-0 gap-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-white/10 flex-shrink-0">
          <DialogTitle className="text-white flex items-center gap-3 text-lg">
            <CreditCard className="w-5 h-5" />
            Complete Payment
          </DialogTitle>
          <DialogDescription className="text-white/50 text-sm">
            Secure checkout powered by Stripe
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner className="w-8 h-8 text-white mb-4" />
              <p className="text-white/50">Initializing...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-500 mb-6">{error}</p>
              <Button
                onClick={createPaymentIntent}
                className="rounded-none bg-white text-black hover:bg-white/90"
              >
                Try Again
              </Button>
            </div>
          )}

          {paymentSuccess && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Payment Complete</h3>
              <p className="text-white/50">You are now enrolled in the course.</p>
              <p className="text-white/30 text-sm mt-3">Redirecting...</p>
            </div>
          )}

          {!loading && !error && !paymentSuccess && clientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#ffffff',
                    colorBackground: '#000000',
                    colorText: '#ffffff',
                    colorDanger: '#ef4444',
                    fontFamily: 'system-ui, sans-serif',
                    borderRadius: '0px',
                  },
                  rules: {
                    '.Input': {
                      backgroundColor: '#000000',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0px',
                    },
                    '.Input:focus': {
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: 'none',
                    },
                    '.Label': {
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    },
                    '.Tab': {
                      backgroundColor: '#000000',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0px',
                    },
                    '.Tab--selected': {
                      backgroundColor: '#000000',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    },
                    '.Tab:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  },
                },
              }}
            >
              <CheckoutForm
                courseTitle={courseTitle}
                amount={amount}
                onSuccess={handleSuccess}
                onCancel={handleClose}
              />
            </Elements>
          )}
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
