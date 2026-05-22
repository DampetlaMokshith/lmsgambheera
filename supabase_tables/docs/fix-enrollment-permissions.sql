-- =====================================================
-- COMPLETE FIX FOR ENROLLMENT PERMISSION ERRORS
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: Fix the users table RLS
-- The users table has RLS enabled but no policies
-- =====================================================

-- First, check if RLS is enabled on users table and disable it
-- We'll use the public.users table for simple metadata, not auth
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS, add proper policies:
-- DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
-- DROP POLICY IF EXISTS "Service role full access" ON public.users;
-- 
-- CREATE POLICY "Users can view their own data" ON public.users
--   FOR SELECT USING (auth.uid() = id);
-- 
-- CREATE POLICY "Service role full access" ON public.users
--   FOR ALL USING (true);

-- =====================================================
-- PART 2: Fix the update_course_enrollment_count trigger function
-- This function fires on course_enrollments insert and needs SECURITY DEFINER
-- =====================================================

-- Drop existing function and recreate with SECURITY DEFINER
DROP FUNCTION IF EXISTS update_course_enrollment_count() CASCADE;

CREATE OR REPLACE FUNCTION update_course_enrollment_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_enrollment_count ON course_enrollments;

CREATE TRIGGER trigger_update_enrollment_count
  AFTER INSERT OR DELETE OR UPDATE ON course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_course_enrollment_count();

-- =====================================================
-- PART 3: Fix the update_updated_at_column function
-- This is used across multiple tables
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 4: Fix RLS policies for course_enrollments
-- Enable RLS and add proper policies
-- =====================================================

ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Service role full access on enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Faculty can view enrollments for their courses" ON course_enrollments;

-- Users can view their own enrollments
CREATE POLICY "Users can view their own enrollments" ON course_enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own enrollments (for free courses)
CREATE POLICY "Users can insert their own enrollments" ON course_enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own enrollments
CREATE POLICY "Users can update their own enrollments" ON course_enrollments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role bypass (for server-side operations)
CREATE POLICY "Service role full access on enrollments" ON course_enrollments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- PART 5: Fix RLS policies for courses table
-- =====================================================

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Faculty can manage their courses" ON courses;
DROP POLICY IF EXISTS "Service role full access on courses" ON courses;

-- Anyone can view courses (needed for enrollment check)
CREATE POLICY "Anyone can view courses" ON courses
  FOR SELECT
  USING (true);

-- Service role can modify courses
CREATE POLICY "Service role full access on courses" ON courses
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- PART 6: Ensure user_profiles has correct policies
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- PART 7: Fix update_daily_activity_summary function
-- =====================================================

CREATE OR REPLACE FUNCTION update_daily_activity_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_activity_summary (user_id, activity_date, total_sessions, total_seconds, total_hours, contribution_level)
  VALUES (
    NEW.user_id,
    NEW.activity_date,
    1,
    NEW.session_duration * 60,
    (NEW.session_duration::decimal / 60),
    CASE 
      WHEN NEW.session_duration >= 60 THEN 4
      WHEN NEW.session_duration >= 30 THEN 3
      WHEN NEW.session_duration >= 15 THEN 2
      ELSE 1
    END
  )
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    total_sessions = daily_activity_summary.total_sessions + 1,
    total_seconds = daily_activity_summary.total_seconds + (NEW.session_duration * 60),
    total_hours = (daily_activity_summary.total_seconds + (NEW.session_duration * 60))::decimal / 3600,
    contribution_level = CASE 
      WHEN (daily_activity_summary.total_seconds + (NEW.session_duration * 60)) >= 14400 THEN 4
      WHEN (daily_activity_summary.total_seconds + (NEW.session_duration * 60)) >= 7200 THEN 3
      WHEN (daily_activity_summary.total_seconds + (NEW.session_duration * 60)) >= 3600 THEN 2
      ELSE 1
    END,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 8: Fix update_progress_summary function
-- =====================================================

CREATE OR REPLACE FUNCTION update_progress_summary()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO course_progress_summary (user_id, course_id, lectures_completed, modules_completed, assignments_completed, quizzes_completed, total_completed)
    VALUES (
      NEW.user_id, 
      NEW.course_id, 
      CASE WHEN NEW.item_type = 'lecture' THEN 1 ELSE 0 END,
      CASE WHEN NEW.item_type = 'module' THEN 1 ELSE 0 END,
      CASE WHEN NEW.item_type = 'assignment' THEN 1 ELSE 0 END,
      CASE WHEN NEW.item_type = 'quiz' THEN 1 ELSE 0 END,
      1
    )
    ON CONFLICT (user_id, course_id)
    DO UPDATE SET
      lectures_completed = course_progress_summary.lectures_completed + CASE WHEN NEW.item_type = 'lecture' THEN 1 ELSE 0 END,
      modules_completed = course_progress_summary.modules_completed + CASE WHEN NEW.item_type = 'module' THEN 1 ELSE 0 END,
      assignments_completed = course_progress_summary.assignments_completed + CASE WHEN NEW.item_type = 'assignment' THEN 1 ELSE 0 END,
      quizzes_completed = course_progress_summary.quizzes_completed + CASE WHEN NEW.item_type = 'quiz' THEN 1 ELSE 0 END,
      total_completed = course_progress_summary.total_completed + 1,
      last_activity = NOW(),
      updated_at = NOW();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE course_progress_summary SET
      lectures_completed = GREATEST(lectures_completed - CASE WHEN OLD.item_type = 'lecture' THEN 1 ELSE 0 END, 0),
      modules_completed = GREATEST(modules_completed - CASE WHEN OLD.item_type = 'module' THEN 1 ELSE 0 END, 0),
      assignments_completed = GREATEST(assignments_completed - CASE WHEN OLD.item_type = 'assignment' THEN 1 ELSE 0 END, 0),
      quizzes_completed = GREATEST(quizzes_completed - CASE WHEN OLD.item_type = 'quiz' THEN 1 ELSE 0 END, 0),
      total_completed = GREATEST(total_completed - 1, 0),
      updated_at = NOW()
    WHERE user_id = OLD.user_id AND course_id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 9: Fix quiz progress function
-- =====================================================

CREATE OR REPLACE FUNCTION update_quiz_progress_after_attempt()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_quiz_progress (user_id, quiz_id, course_id, total_attempts, best_score, best_percentage, completed, passed, first_attempted_at, last_attempted_at)
  VALUES (
    NEW.user_id,
    NEW.quiz_id,
    NEW.course_id,
    1,
    NEW.score,
    NEW.percentage,
    true,
    NEW.passed,
    NEW.attempted_at,
    NEW.attempted_at
  )
  ON CONFLICT (user_id, quiz_id, course_id)
  DO UPDATE SET
    total_attempts = user_quiz_progress.total_attempts + 1,
    best_score = GREATEST(user_quiz_progress.best_score, NEW.score),
    best_percentage = GREATEST(user_quiz_progress.best_percentage, NEW.percentage),
    passed = user_quiz_progress.passed OR NEW.passed,
    last_attempted_at = NEW.attempted_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 10: Fix user_lecture_notes updated_at function
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_lecture_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 11: Fix RLS for other tables needed for enrollment flow
-- =====================================================

-- course_progress_summary
ALTER TABLE course_progress_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own progress" ON course_progress_summary;
DROP POLICY IF EXISTS "Users can insert own progress" ON course_progress_summary;
DROP POLICY IF EXISTS "Users can update own progress" ON course_progress_summary;
CREATE POLICY "Users can manage own progress" ON course_progress_summary FOR ALL USING (auth.uid() = user_id);

-- user_activities
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own activities" ON user_activities;
CREATE POLICY "Users can manage own activities" ON user_activities FOR ALL USING (auth.uid() = user_id);

-- daily_activity_summary
ALTER TABLE daily_activity_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own daily summary" ON daily_activity_summary;
CREATE POLICY "Users can manage own daily summary" ON daily_activity_summary FOR ALL USING (auth.uid() = user_id);

-- course_item_completions
ALTER TABLE course_item_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own completions" ON course_item_completions;
CREATE POLICY "Users can manage own completions" ON course_item_completions FOR ALL USING (auth.uid() = user_id);

-- user_lecture_notes
ALTER TABLE user_lecture_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own notes" ON user_lecture_notes;
CREATE POLICY "Users can manage own notes" ON user_lecture_notes FOR ALL USING (auth.uid() = user_id);

-- user_quiz_attempts
ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own quiz attempts" ON user_quiz_attempts;
CREATE POLICY "Users can manage own quiz attempts" ON user_quiz_attempts FOR ALL USING (auth.uid() = user_id);

-- user_quiz_progress
ALTER TABLE user_quiz_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own quiz progress" ON user_quiz_progress;
CREATE POLICY "Users can manage own quiz progress" ON user_quiz_progress FOR ALL USING (auth.uid() = user_id);

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- course_discussions
ALTER TABLE course_discussions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view discussions" ON course_discussions;
DROP POLICY IF EXISTS "Users can manage own discussions" ON course_discussions;
CREATE POLICY "Anyone can view discussions" ON course_discussions FOR SELECT USING (true);
CREATE POLICY "Users can manage own discussions" ON course_discussions FOR ALL USING (auth.uid() = user_id);

-- lecture_discussions
ALTER TABLE lecture_discussions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view lecture discussions" ON lecture_discussions;
DROP POLICY IF EXISTS "Users can manage own lecture discussions" ON lecture_discussions;
CREATE POLICY "Anyone can view lecture discussions" ON lecture_discussions FOR SELECT USING (true);
CREATE POLICY "Users can manage own lecture discussions" ON lecture_discussions FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- PART 12: Grant service role bypass for all operations
-- This ensures our API with service role key works
-- =====================================================

-- The service role key has full access by default
-- But we should ensure RLS doesn't block it

-- Create a helper function for checking service role
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'role') = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- =====================================================

-- Check RLS status on all tables:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public';

-- Test enrollment (replace with actual IDs):
-- INSERT INTO course_enrollments (user_id, course_id, status, progress, user_name, user_email)
-- VALUES ('your-user-uuid', 'your-course-uuid', 'active', 0, 'Test User', 'test@test.com');

SELECT 'All fixes applied successfully!' as status;
