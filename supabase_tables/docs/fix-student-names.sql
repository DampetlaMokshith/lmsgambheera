-- Solution 1: Populate profiles table from auth.users (RECOMMENDED)
-- This syncs the profiles table with existing auth users
-- Run this if you want to maintain a separate profiles table

INSERT INTO profiles (id, email, full_name, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email), -- Use full_name from metadata or fallback to email
  created_at,
  NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- OR

-- Solution 2: Add user name and email columns directly to course_enrollments (ALTERNATIVE)
-- This denormalizes the data but makes queries simpler
-- Run this if you don't want to maintain a separate profiles table

-- First, add the columns if they don't exist
ALTER TABLE course_enrollments 
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Then populate them from auth.users
UPDATE course_enrollments ce
SET 
  user_name = COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  user_email = u.email
FROM auth.users u
WHERE ce.user_id = u.id;

-- Create a trigger to automatically populate these fields on new enrollments (OPTIONAL)
CREATE OR REPLACE FUNCTION update_enrollment_user_info()
RETURNS TRIGGER AS $$
BEGIN
  SELECT 
    COALESCE(raw_user_meta_data->>'full_name', email),
    email
  INTO NEW.user_name, NEW.user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_enrollment_user_info ON course_enrollments;

CREATE TRIGGER trigger_update_enrollment_user_info
  BEFORE INSERT OR UPDATE ON course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_user_info();

-- Verify the data is populated
SELECT 
  ce.user_id,
  ce.user_name,
  ce.user_email,
  ce.course_id
FROM course_enrollments ce
LIMIT 10;
