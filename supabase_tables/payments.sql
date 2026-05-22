-- Payments table to track all course payments and enrollments
-- This table stores payment information and links to course enrollments

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  course_sanity_id TEXT NOT NULL,
  course_title TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in smallest currency unit (paise for INR)
  currency TEXT NOT NULL DEFAULT 'inr',
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
  payment_method TEXT,
  receipt_email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_course_id ON payments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_course_sanity_id ON payments(course_sanity_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payments
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own payments (for creating payment intents)
CREATE POLICY "Users can create their own payments" ON payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can update payments (for webhook updates)
CREATE POLICY "Service role can update payments" ON payments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at_trigger
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Function to check if a user has a successful payment for a course
CREATE OR REPLACE FUNCTION has_paid_for_course(p_user_id UUID, p_course_sanity_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM payments 
    WHERE user_id = p_user_id 
    AND course_sanity_id = p_course_sanity_id 
    AND status = 'succeeded'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION has_paid_for_course TO authenticated;
