-- Notifications table for user notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'welcome_signup',
    'welcome_back', 
    'profile_incomplete',
    'faculty_greeting',
    'course_added',
    'course_updated',
    'todo_assigned',
    'discussion_reply',
    'assignment_graded',
    'course_enrolled',
    'lecture_released'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to insert notifications (for triggers and backend operations)
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_notifications_updated_at 
BEFORE UPDATE ON notifications 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create welcome notification for new users
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.id,
    'welcome_signup',
    'Welcome to THREADLMS! 🎉',
    'Thank you for choosing our LMS platform! We''re excited to start your learning journey with us. Let''s go! 🚀',
    jsonb_build_object(
      'icon', '🎉',
      'actionUrl', '/courses'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_welcome_notification();

-- Function to create welcome back notification
CREATE OR REPLACE FUNCTION create_welcome_back_notification(user_uuid UUID)
RETURNS void AS $$
DECLARE
  last_login TIMESTAMP WITH TIME ZONE;
  user_email TEXT;
BEGIN
  -- Get user's last login from auth.users or user metadata
  SELECT email INTO user_email FROM auth.users WHERE id = user_uuid;
  
  -- Check if user has been away for more than 24 hours
  SELECT created_at INTO last_login 
  FROM notifications 
  WHERE user_id = user_uuid AND type = 'welcome_back'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- If no previous welcome_back or last one was more than 24 hours ago
  IF last_login IS NULL OR last_login < (now() - interval '24 hours') THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      user_uuid,
      'welcome_back',
      'Welcome back! 👋',
      'We''re glad to see you again. Continue your learning journey where you left off.',
      jsonb_build_object(
        'icon', '👋',
        'actionUrl', '/dashboard'
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create course-related notifications
CREATE OR REPLACE FUNCTION create_course_notification(
  user_uuid UUID,
  notification_type VARCHAR(50),
  course_title TEXT,
  course_id TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_icon TEXT;
BEGIN
  CASE notification_type
    WHEN 'course_added' THEN
      notification_title := 'New Course Available! 📚';
      notification_message := 'A new course "' || course_title || '" has been added. Check it out!';
      notification_icon := '📚';
    WHEN 'course_updated' THEN
      notification_title := 'Course Updated 🔄';
      notification_message := 'The course "' || course_title || '" has been updated with new content.';
      notification_icon := '🔄';
    WHEN 'course_enrolled' THEN
      notification_title := 'Successfully Enrolled! ✅';
      notification_message := 'You have been enrolled in "' || course_title || '". Start learning now!';
      notification_icon := '✅';
    WHEN 'lecture_released' THEN
      notification_title := 'New Lecture Released! 🎥';
      notification_message := 'A new lecture is available in "' || course_title || '".';
      notification_icon := '🎥';
    ELSE
      notification_title := 'Course Notification';
      notification_message := 'Course "' || course_title || '" has been updated.';
      notification_icon := '📋';
  END CASE;

  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    user_uuid,
    notification_type,
    notification_title,
    notification_message,
    jsonb_build_object(
      'icon', notification_icon,
      'courseId', course_id,
      'courseTitle', course_title,
      'actionUrl', CASE 
        WHEN course_id IS NOT NULL THEN '/courses/' || course_id
        ELSE '/courses'
      END
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create discussion notifications
CREATE OR REPLACE FUNCTION create_discussion_notification(
  user_uuid UUID,
  course_title TEXT,
  author_name TEXT,
  course_id TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    user_uuid,
    'discussion_reply',
    'New Discussion Reply 💬',
    author_name || ' replied to your discussion in "' || course_title || '".',
    jsonb_build_object(
      'icon', '💬',
      'courseId', course_id,
      'courseTitle', course_title,
      'authorName', author_name,
      'actionUrl', CASE 
        WHEN course_id IS NOT NULL THEN '/courses/learn/' || course_id || '#discussions'
        ELSE '/courses'
      END
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create todo/assignment notifications
CREATE OR REPLACE FUNCTION create_todo_notification(
  user_uuid UUID,
  assignment_title TEXT,
  course_title TEXT,
  assignment_id TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    user_uuid,
    'todo_assigned',
    'New Assignment Added! 📝',
    'You have a new assignment "' || assignment_title || '" in "' || course_title || '".',
    jsonb_build_object(
      'icon', '📝',
      'assignmentId', assignment_id,
      'assignmentTitle', assignment_title,
      'courseTitle', course_title,
      'actionUrl', '/dashboard'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create profile incomplete notification
CREATE OR REPLACE FUNCTION create_profile_incomplete_notification(user_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Delete any existing profile_incomplete notifications for this user
  DELETE FROM notifications 
  WHERE user_id = user_uuid 
  AND type = 'profile_incomplete';

  -- Create new profile incomplete notification
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    user_uuid,
    'profile_incomplete',
    'Complete Your Profile 📋',
    'Please fill in all your details in the profile page to get the most out of your learning experience.',
    jsonb_build_object(
      'icon', '📋',
      'actionUrl', '/profile',
      'actionText', 'Complete Profile'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create faculty greeting notification
CREATE OR REPLACE FUNCTION create_faculty_greeting_notification(
  user_uuid UUID,
  greeting_time TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    user_uuid,
    'faculty_greeting',
    greeting_time || ', Professor! 👋',
    'What''s up! Ready to launch a new course? Let''s inspire the next generation of learners! 🚀',
    jsonb_build_object(
      'icon', '👋',
      'actionUrl', '/faculty/creatingnewcourse',
      'actionText', 'Create New Course'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample notifications for testing (optional - remove in production)
-- INSERT INTO notifications (user_id, type, title, message, data) VALUES
-- ((SELECT id FROM auth.users LIMIT 1), 'course_added', 'New Course Available! 📚', 'Advanced React Development course has been added to the platform.', '{"icon": "📚", "actionUrl": "/courses"}'),
-- ((SELECT id FROM auth.users LIMIT 1), 'discussion_reply', 'New Discussion Reply 💬', 'John Doe replied to your discussion in "Introduction to Programming".', '{"icon": "💬", "authorName": "John Doe", "actionUrl": "/courses/learn/intro-programming"}'),
-- ((SELECT id FROM auth.users LIMIT 1), 'todo_assigned', 'New Assignment Added! 📝', 'Complete the React Hooks exercise in Advanced React Development.', '{"icon": "📝", "actionUrl": "/dashboard"}');