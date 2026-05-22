-- =====================================================
-- FIX RLS POLICIES FOR ENROLLMENT QUERIES
-- Run this in Supabase SQL Editor
-- This enables users to READ their enrolled courses
-- =====================================================

-- STEP 1: Enable RLS on course_enrollments (if not already)
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies on course_enrollments to start fresh
DROP POLICY IF EXISTS "Users can view their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Service role full access on enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Faculty can view enrollments for their courses" ON course_enrollments;
DROP POLICY IF EXISTS "Anyone can view enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "allow_select_own_enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "allow_insert_own_enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "allow_update_own_enrollments" ON course_enrollments;

-- STEP 3: Create SELECT policy - Users can read their own enrollments
CREATE POLICY "allow_select_own_enrollments" ON course_enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

-- STEP 4: Create INSERT policy - Users can create their own enrollments
CREATE POLICY "allow_insert_own_enrollments" ON course_enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- STEP 5: Create UPDATE policy - Users can update their own enrollments  
CREATE POLICY "allow_update_own_enrollments" ON course_enrollments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- STEP 6: Fix RLS on courses table to allow public read
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
DROP POLICY IF EXISTS "allow_public_read_courses" ON courses;

CREATE POLICY "allow_public_read_courses" ON courses
  FOR SELECT
  USING (true);

-- STEP 7: Fix RLS on course_progress_summary table
ALTER TABLE course_progress_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own progress" ON course_progress_summary;
DROP POLICY IF EXISTS "allow_own_progress_access" ON course_progress_summary;

CREATE POLICY "allow_own_progress_access" ON course_progress_summary
  FOR ALL
  USING (auth.uid() = user_id);

-- STEP 8: Fix RLS on user_profiles table  
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "allow_own_profile" ON user_profiles;

CREATE POLICY "allow_own_profile" ON user_profiles
  FOR ALL
  USING (auth.uid() = user_id);

-- STEP 9: Fix RLS on user_quiz_attempts table
ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own quiz attempts" ON user_quiz_attempts;
DROP POLICY IF EXISTS "allow_own_quiz_attempts" ON user_quiz_attempts;

CREATE POLICY "allow_own_quiz_attempts" ON user_quiz_attempts
  FOR ALL
  USING (auth.uid() = user_id);

-- STEP 10: Fix RLS on user_quiz_progress table
ALTER TABLE user_quiz_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own quiz progress" ON user_quiz_progress;
DROP POLICY IF EXISTS "allow_own_quiz_progress" ON user_quiz_progress;

CREATE POLICY "allow_own_quiz_progress" ON user_quiz_progress
  FOR ALL
  USING (auth.uid() = user_id);

-- VERIFICATION: Check if policies are created
SELECT tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('course_enrollments', 'courses', 'course_progress_summary', 'user_profiles')
ORDER BY tablename, policyname;

SELECT 'RLS POLICIES APPLIED SUCCESSFULLY!' as status;
