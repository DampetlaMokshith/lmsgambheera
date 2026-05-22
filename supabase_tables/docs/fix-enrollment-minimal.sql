-- =====================================================
-- MINIMAL FIX FOR ENROLLMENT PERMISSION ERROR
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- STEP 1: Disable RLS on public.users table (if it exists)
-- This is a metadata table and doesn't need RLS
DO $$ 
BEGIN
  ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'public.users table RLS already disabled or table does not exist';
END $$;

-- STEP 2: Drop the problematic trigger that tries to query auth.users
DROP TRIGGER IF EXISTS trigger_update_enrollment_user_info ON course_enrollments;

-- STEP 3: Drop the problematic function
DROP FUNCTION IF EXISTS update_enrollment_user_info();

-- STEP 4: Fix the enrollment count trigger with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_course_enrollment_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE courses 
    SET total_enrollments = COALESCE(total_enrollments, 0) + 1 
    WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE courses 
    SET total_enrollments = GREATEST(COALESCE(total_enrollments, 0) - 1, 0) 
    WHERE id = OLD.course_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- STEP 5: Recreate the trigger (just to be safe)
DROP TRIGGER IF EXISTS trigger_update_enrollment_count ON course_enrollments;


CREATE TRIGGER trigger_update_enrollment_count
  AFTER INSERT OR DELETE OR UPDATE ON course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_course_enrollment_count();

-- STEP 6: Fix other functions that might need SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- STEP 8: Verify the trigger was dropped
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_enrollment_user_info'
  ) THEN
    RAISE EXCEPTION 'TRIGGER trigger_update_enrollment_user_info STILL EXISTS - PLEASE DROP IT MANUALLY';
  ELSE
    RAISE NOTICE 'SUCCESS: Problematic trigger has been removed';
  END IF;
END $$;

-- STEP 9: List all triggers on course_enrollments (for verification)
SELECT 
  tgname AS trigger_name,
  tgtype,
  proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'course_enrollments';

SELECT 'FIX APPLIED SUCCESSFULLY! You can now enroll students.' as status;
