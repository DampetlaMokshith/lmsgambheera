import { supabase } from '@/lib/supabase';

// Function to get enrollment count for a single course (using Sanity ID)
export async function getCourseEnrollmentCount(sanityId: string): Promise<number> {
  try {
    console.log('🔍 Fetching enrollment count for Sanity course:', sanityId);

    // First get the Supabase course ID from Sanity ID
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('sanity_id', sanityId)
      .single();

    if (courseError || !course) {
      console.log('Course not found in Supabase for Sanity ID:', sanityId);
      return 0;
    }

    // Count enrollments for this course
    const { count, error } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', course.id);

    if (error) {
      console.error('Error fetching enrollment count:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        sanityId,
        supabaseId: course.id
      });
      return 0;
    }

    console.log(`✅ Enrollment count for course ${sanityId} (${course.id}):`, count);
    return count || 0;
  } catch (error) {
    console.error('Error in getCourseEnrollmentCount:', error);
    return 0;
  }
}

// Function to get enrollment counts for multiple courses (using Sanity IDs)
export async function getMultipleCourseEnrollmentCounts(sanityIds: string[]): Promise<Record<string, number>> {
  try {
    if (sanityIds.length === 0) return {};

    console.log('🔍 Fetching enrollment counts for Sanity courses:', sanityIds);

    // Get all Supabase course IDs from Sanity IDs
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, sanity_id')
      .in('sanity_id', sanityIds);

    if (coursesError || !courses) {
      console.error('Error fetching courses from Supabase:', {
        message: coursesError?.message,
        details: coursesError?.details,
        hint: coursesError?.hint,
        code: coursesError?.code
      });
      return {};
    }

    console.log('📊 Found courses in Supabase:', courses);

    // Create a map of sanity_id to supabase id
    const sanityToSupabaseMap = courses.reduce((map, course) => {
      map[course.sanity_id] = course.id;
      return map;
    }, {} as Record<string, string>);

    // Get all Supabase course IDs for enrollment counting
    const supabaseCourseIds = courses.map(course => course.id);

    if (supabaseCourseIds.length === 0) {
      console.log('No matching courses found in Supabase');
      return {};
    }

    // Get enrollment counts
    const { data: enrollments, error } = await supabase
      .from('course_enrollments')
      .select('course_id')
      .in('course_id', supabaseCourseIds);

    if (error) {
      console.error('Error fetching multiple enrollment counts:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return {};
    }

    console.log('📊 Raw enrollment data:', enrollments);

    // Count enrollments for each Supabase course ID
    const supabaseEnrollmentCounts: Record<string, number> = {};
    
    // Initialize all Supabase course IDs with 0
    supabaseCourseIds.forEach(id => {
      supabaseEnrollmentCounts[id] = 0;
    });

    // Count actual enrollments
    enrollments?.forEach(enrollment => {
      supabaseEnrollmentCounts[enrollment.course_id] = (supabaseEnrollmentCounts[enrollment.course_id] || 0) + 1;
    });

    // Convert back to Sanity ID mapping
    const sanityEnrollmentCounts: Record<string, number> = {};
    sanityIds.forEach(sanityId => {
      const supabaseId = sanityToSupabaseMap[sanityId];
      sanityEnrollmentCounts[sanityId] = supabaseId ? (supabaseEnrollmentCounts[supabaseId] || 0) : 0;
    });

    console.log('✅ Final enrollment counts:', sanityEnrollmentCounts);

    return sanityEnrollmentCounts;
  } catch (error) {
    console.error('Error in getMultipleCourseEnrollmentCounts:', error);
    return {};
  }
}

// Function to check if a user is enrolled in a course
export async function isUserEnrolledInCourse(userId: string, courseId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking enrollment:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in isUserEnrolledInCourse:', error);
    return false;
  }
}

// Function to enroll a user in a course
export async function enrollUserInCourse(userId: string, courseId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('course_enrollments')
      .insert([
        {
          user_id: userId,
          course_id: courseId,
          enrolled_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error enrolling user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in enrollUserInCourse:', error);
    return false;
  }
}

// Function to get all courses a user is enrolled in
export async function getUserEnrolledCourses(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('course_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user enrollments:', error);
      return [];
    }

    return data?.map(enrollment => enrollment.course_id) || [];
  } catch (error) {
    console.error('Error in getUserEnrolledCourses:', error);
    return [];
  }
}