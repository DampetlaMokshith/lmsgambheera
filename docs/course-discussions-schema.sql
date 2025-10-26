-- Course Discussion System Schema
-- Run this SQL in your Supabase SQL Editor

-- First, create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create discussions table for course messages
CREATE TABLE IF NOT EXISTS course_discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id TEXT NOT NULL, -- Sanity course ID
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    parent_id UUID REFERENCES course_discussions(id) ON DELETE CASCADE, -- For replies
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_discussions_course_id ON course_discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_discussions_user_id ON course_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_discussions_parent_id ON course_discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_course_discussions_created_at ON course_discussions(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_discussions_updated_at
    BEFORE UPDATE ON course_discussions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE course_discussions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read all discussions for courses they have access to
CREATE POLICY "Users can read course discussions" ON course_discussions
    FOR SELECT USING (true); -- Allow all authenticated users to read

-- Users can insert their own messages
CREATE POLICY "Users can insert their own messages" ON course_discussions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON course_discussions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON course_discussions
    FOR DELETE USING (auth.uid() = user_id);

-- Create a view to get discussion messages with user details
CREATE OR REPLACE VIEW course_discussions_with_users AS
SELECT 
    d.id,
    d.course_id,
    d.user_id,
    d.message,
    d.parent_id,
    d.is_edited,
    d.created_at,
    d.updated_at,
    u.email as user_email,
    COALESCE(p.full_name, SPLIT_PART(u.email, '@', 1)) as user_name,
    p.avatar_url
FROM course_discussions d
LEFT JOIN auth.users u ON d.user_id = u.id
LEFT JOIN profiles p ON d.user_id = p.id
ORDER BY d.created_at ASC;

-- Grant permissions
GRANT SELECT ON course_discussions_with_users TO authenticated;
GRANT ALL ON course_discussions TO authenticated;
GRANT ALL ON profiles TO authenticated;