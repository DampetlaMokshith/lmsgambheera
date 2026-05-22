-- Quiz Attempts Table
-- Stores individual quiz attempts with detailed information
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  course_name TEXT,
  
  -- Quiz Configuration
  total_questions INTEGER NOT NULL,
  time_limit_minutes INTEGER,
  allows_retakes BOOLEAN DEFAULT false,
  passing_score_percentage INTEGER DEFAULT 60,
  
  -- Attempt Details
  questions_answered INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  
  -- Time Tracking
  time_taken INTEGER NOT NULL DEFAULT 0, -- in seconds
  time_remaining INTEGER DEFAULT 0, -- in seconds
  
  -- Answer Data
  answers JSONB, -- stores user's answers
  
  -- Timestamps
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for faster queries
  CONSTRAINT user_quiz_attempts_user_quiz_idx UNIQUE (id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON user_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON user_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_course_id ON user_quiz_attempts(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON user_quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_attempted_at ON user_quiz_attempts(attempted_at DESC);

-- Quiz Progress Table
-- Stores aggregate progress for each user's quiz
CREATE TABLE IF NOT EXISTS user_quiz_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  
  -- Progress Tracking
  total_attempts INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  best_percentage INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  passed BOOLEAN DEFAULT false,
  
  -- Timestamps
  first_attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one progress record per user per quiz
  CONSTRAINT user_quiz_progress_unique UNIQUE (user_id, quiz_id, course_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_progress_user_id ON user_quiz_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_progress_quiz_id ON user_quiz_progress(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_progress_course_id ON user_quiz_progress(course_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_quiz_attempts
-- Users can view their own quiz attempts
CREATE POLICY "Users can view their own quiz attempts"
  ON user_quiz_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own quiz attempts
CREATE POLICY "Users can insert their own quiz attempts"
  ON user_quiz_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own quiz attempts
CREATE POLICY "Users can update their own quiz attempts"
  ON user_quiz_attempts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_quiz_progress
-- Users can view their own quiz progress
CREATE POLICY "Users can view their own quiz progress"
  ON user_quiz_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own quiz progress
CREATE POLICY "Users can insert their own quiz progress"
  ON user_quiz_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own quiz progress
CREATE POLICY "Users can update their own quiz progress"
  ON user_quiz_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to automatically update quiz progress after quiz attempt
CREATE OR REPLACE FUNCTION update_quiz_progress_after_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update quiz progress
  INSERT INTO user_quiz_progress (
    user_id,
    quiz_id,
    course_id,
    total_attempts,
    best_score,
    best_percentage,
    completed,
    passed,
    last_attempted_at
  )
  VALUES (
    NEW.user_id,
    NEW.quiz_id,
    NEW.course_id,
    1,
    NEW.score,
    NEW.percentage,
    true,
    NEW.passed,
    NEW.attempted_at
  )
  ON CONFLICT (user_id, quiz_id, course_id)
  DO UPDATE SET
    total_attempts = user_quiz_progress.total_attempts + 1,
    best_score = GREATEST(user_quiz_progress.best_score, NEW.score),
    best_percentage = GREATEST(user_quiz_progress.best_percentage, NEW.percentage),
    completed = true,
    passed = user_quiz_progress.passed OR NEW.passed,
    last_attempted_at = NEW.attempted_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update progress after quiz attempt
DROP TRIGGER IF EXISTS trigger_update_quiz_progress ON user_quiz_attempts;
CREATE TRIGGER trigger_update_quiz_progress
  AFTER INSERT ON user_quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_progress_after_attempt();

-- Sample queries to verify setup
-- View all quiz attempts for a user
-- SELECT * FROM user_quiz_attempts WHERE user_id = 'YOUR_USER_ID' ORDER BY attempted_at DESC;

-- View quiz progress for a user
-- SELECT * FROM user_quiz_progress WHERE user_id = 'YOUR_USER_ID';

-- Get latest attempt for a specific quiz
-- SELECT * FROM user_quiz_attempts 
-- WHERE user_id = 'YOUR_USER_ID' AND quiz_id = 'YOUR_QUIZ_ID' 
-- ORDER BY attempted_at DESC LIMIT 1;
