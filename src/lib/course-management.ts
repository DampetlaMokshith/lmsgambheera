import { supabase } from '@/lib/supabase';

export interface SanityCourse {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  description: string;
  thumbnail?: {
    asset: {
      url: string;
    };
  };
  faculty: {
    name: string;
    email: string;
  };
  rating: number;
  totalEnrollments: number;
  estimatedDuration: number;
  level: string;
  price: number;
  tags: string[];
  degree: string;
  department: string;
  language: string;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: string;
}

/**
 * Sync course data from Sanity to Supabase
 * This function should be called whenever a course is published in Sanity
 */
export async function syncCourseToSupabase(course: SanityCourse) {
  try {
    const courseData = {
      sanity_id: course._id,
      title: course.title,
      slug: course.slug.current,
      description: course.description,
      thumbnail_url: course.thumbnail?.asset?.url || null,
      faculty_name: course.faculty.name,
      faculty_email: course.faculty.email,
      rating: course.rating || 4.5,
      total_enrollments: course.totalEnrollments || 0,
      estimated_duration: course.estimatedDuration,
      level: course.level,
      price: course.price || 0,
      tags: course.tags || [],
      degree: course.degree,
      department: course.department,
      language: course.language || 'English',
      is_published: course.isPublished,
      is_featured: course.isFeatured || false,
      published_at: course.publishedAt ? new Date(course.publishedAt).toISOString() : null,
    };

    // Use upsert to insert or update
    const { data, error } = await supabase
      .from('courses')
      .upsert(courseData, {
        onConflict: 'sanity_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      throw new Error(`Supabase sync error: ${error.message} (Code: ${error.code})`);
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
    throw new Error(`Course sync failed: ${errorMessage}`);
  }
}

/**
 * Get Supabase course ID from Sanity course ID
 */
export async function getSupabaseCourseId(sanityId: string) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id')
      .eq('sanity_id', sanityId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Course with Sanity ID "${sanityId}" not found in Supabase. Please sync the course first.`);
      }
      
      // Improve error logging
      const errorDetails = {
        code: error.code || 'UNKNOWN',
        message: error.message || 'Unknown error message',
        details: error.details || 'No additional details',
        hint: error.hint || 'No hint available'
      };
      
      throw new Error(`Database error: ${errorDetails.message} (Code: ${errorDetails.code})`);
    }

    if (!data?.id) {
      throw new Error(`Course found but missing ID in Supabase for Sanity ID: ${sanityId}`);
    }

    return data.id;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error getting course ID';
    throw new Error(errorMessage);
  }
}

/**
 * Enroll a user in a course using Sanity course ID
 */
export async function enrollUserInCourseBySanityId(userId: string, sanityId: string) {
  try {
    // First get the Supabase course ID
    const supabaseCourseId = await getSupabaseCourseId(sanityId);
    
    if (!supabaseCourseId) {
      throw new Error('Course not found in database. Please sync course first.');
    }

    // Then enroll using Supabase ID
    return await enrollUserInCourse(userId, supabaseCourseId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown enrollment error';
    throw new Error(`Enrollment failed: ${errorMessage}`);
  }
}

/**
 * Check enrollment using Sanity course ID
 */
export async function checkUserEnrollmentBySanityId(userId: string, sanityId: string) {
  try {
    // First get the Supabase course ID
    const supabaseCourseId = await getSupabaseCourseId(sanityId);
    
    if (!supabaseCourseId) {
      return null; // Course not synced yet
    }

    // Then check enrollment using Supabase ID
    return await checkUserEnrollment(userId, supabaseCourseId);
  } catch (error) {
    return null;
  }
}

/**
 * Enroll a user in a course
 */
export async function enrollUserInCourse(userId: string, courseId: string) {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        status: 'active',
        progress: 0
      })
      .select();

    if (error) {
      // Handle duplicate enrollment
      if (error.code === '23505') {
        throw new Error('User is already enrolled in this course');
      }
      throw new Error(`Enrollment error: ${error.message} (Code: ${error.code})`);
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown enrollment error';
    throw new Error(errorMessage);
  }
}

/**
 * Get user's enrolled courses
 */
export async function getUserEnrolledCourses(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_course_progress')
      .select('*')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get course statistics for faculty
 */
export async function getCourseStats(facultyEmail: string) {
  try {
    const { data, error } = await supabase
      .from('course_stats')
      .select('*')
      .eq('faculty_email', facultyEmail);

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get course by slug from Supabase
 */
export async function getCourseBySlugFromSupabase(slug: string) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if user is enrolled in a course
 */
export async function checkUserEnrollment(userId: string, courseId: string) {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get enrollment count for a course by Sanity ID
 */
export async function getCourseEnrollmentCount(sanityId: string): Promise<number> {
  try {
    // First get the Supabase course ID from Sanity ID
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('sanity_id', sanityId)
      .single();

    if (courseError || !course) {
      return 0;
    }

    // Count enrollments for this course
    const { count, error: countError } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', course.id);

    if (countError) {
      return 0;
    }

    return count || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Get enrollment counts for multiple courses by Sanity IDs
 */
export async function getMultipleCourseEnrollmentCounts(sanityIds: string[]): Promise<Record<string, number>> {
  try {
    // Get all Supabase course IDs from Sanity IDs
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, sanity_id')
      .in('sanity_id', sanityIds);

    if (coursesError || !courses) {
      return {};
    }

    // Create a map of sanity_id to supabase id
    const sanityToSupabaseMap = courses.reduce((map, course) => {
      map[course.sanity_id] = course.id;
      return map;
    }, {} as Record<string, string>);

    // Get enrollment counts for all courses
    const supabaseIds = courses.map(course => course.id);
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select('course_id')
      .in('course_id', supabaseIds);

    if (enrollmentsError) {
      return {};
    }

    // Count enrollments per course
    const enrollmentCounts = enrollments?.reduce((counts, enrollment) => {
      counts[enrollment.course_id] = (counts[enrollment.course_id] || 0) + 1;
      return counts;
    }, {} as Record<string, number>) || {};

    // Convert back to sanity IDs
    const result: Record<string, number> = {};
    Object.entries(sanityToSupabaseMap).forEach(([sanityId, supabaseId]) => {
      result[sanityId] = enrollmentCounts[supabaseId] || 0;
    });

    return result;
  } catch (error) {
    return {};
  }
}

/**
 * Get course progress for a specific user and course
 */
export async function getCourseProgress(userId: string, courseId: string): Promise<number> {
  try {
    // First try with Sanity ID
    let { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('progress')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    // If not found, try to find the course by sanity_id and get the supabase ID
    if (!enrollment) {
      const { data: course } = await supabase
        .from('courses')
        .select('id')
        .eq('sanity_id', courseId)
        .single();

      if (course) {
        const { data: enrollmentByCourse } = await supabase
          .from('course_enrollments')
          .select('progress')
          .eq('user_id', userId)
          .eq('course_id', course.id)
          .single();
        
        enrollment = enrollmentByCourse;
      }
    }

    return enrollment?.progress || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Get multiple course progress for a user
 */
export async function getMultipleCourseProgress(userId: string, courseIds: string[]): Promise<Record<string, number>> {
  try {
    if (!userId || courseIds.length === 0) {
      return {};
    }

    // Get mapping of sanity IDs to Supabase IDs
    const { data: courses } = await supabase
      .from('courses')
      .select('id, sanity_id')
      .in('sanity_id', courseIds);

    if (!courses || courses.length === 0) {
      return {};
    }

    // Create mapping
    const sanityToSupabaseMap: Record<string, string> = {};
    courses.forEach(course => {
      if (course.sanity_id) {
        sanityToSupabaseMap[course.sanity_id] = course.id;
      }
    });

    // Get enrollments for these courses
    const supabaseIds = Object.values(sanityToSupabaseMap);
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id, progress')
      .eq('user_id', userId)
      .in('course_id', supabaseIds);

    if (!enrollments || enrollments.length === 0) {
      return {};
    }

    // Map progress per course
    const progressMap = enrollments.reduce((progress, enrollment) => {
      progress[enrollment.course_id] = enrollment.progress || 0;
      return progress;
    }, {} as Record<string, number>);

    // Convert back to sanity IDs
    const result: Record<string, number> = {};
    Object.entries(sanityToSupabaseMap).forEach(([sanityId, supabaseId]) => {
      result[sanityId] = progressMap[supabaseId] || 0;
    });

    return result;
  } catch (error) {
    return {};
  }
}

/**
 * Update course progress for a user
 */
export async function updateCourseProgress(userId: string, courseId: string, progress: number): Promise<boolean> {
  try {
    // Ensure progress is between 0 and 100
    const clampedProgress = Math.max(0, Math.min(100, progress));
    
    // First try with Sanity ID
    let { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    // If not found, try to find the course by sanity_id and get the supabase ID
    if (!enrollment) {
      const { data: course } = await supabase
        .from('courses')
        .select('id')
        .eq('sanity_id', courseId)
        .single();

      if (course) {
        const { data: enrollmentByCourse } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('user_id', userId)
          .eq('course_id', course.id)
          .single();
        
        enrollment = enrollmentByCourse;
      }
    }

    if (!enrollment) {
      return false;
    }

    // Update progress
    const { error } = await supabase
      .from('course_enrollments')
      .update({ 
        progress: clampedProgress,
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollment.id);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}