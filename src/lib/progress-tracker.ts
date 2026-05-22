import { supabase } from './supabase';

export interface ProgressData {
  lectureProgress: Record<string, boolean>;
  moduleProgress: Record<string, boolean>;
  assignmentProgress: Record<string, boolean>;
  quizProgress: Record<string, { completed: boolean; score?: number; maxScore?: number }>;
}

export interface CourseProgress {
  overall_percentage: number;
  completed_lectures: number;
  total_lectures: number;
  completed_modules: number;
  total_modules: number;
  completed_assignments: number;
  total_assignments: number;
  completed_quizzes: number;
  total_quizzes: number;
}

export class ProgressTracker {
  static async initializeCourseProgress(userId: string, courseId: string, courseSections: any[]) {
    try {
      // Count total items
      let totalLectures = 0;
      let totalModules = 0;
      let totalAssignments = 0;
      let totalQuizzes = 0;

      courseSections.forEach(section => {
        totalLectures += section.lectures?.length || 0;
        totalModules += section.modules?.length || 0;
        totalAssignments += section.assignments?.length || 0;
        totalQuizzes += section.quizzes?.length || 0;
      });

      // Initialize course progress record
      const { error } = await supabase
        .from('user_detailed_course_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          total_lectures: totalLectures,
          total_modules: totalModules,
          total_assignments: totalAssignments,
          total_quizzes: totalQuizzes
        });

      if (error) throw error;
      return { totalLectures, totalModules, totalAssignments, totalQuizzes };
    } catch (error) {
      throw error;
    }
  }

  static async fetchCourseProgress(userId: string, courseId: string): Promise<CourseProgress> {
    try {
      const { data, error } = await supabase
        .from('user_detailed_course_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (error) throw error;
      return data || {
        overall_percentage: 0,
        completed_lectures: 0,
        total_lectures: 0,
        completed_modules: 0,
        total_modules: 0,
        completed_assignments: 0,
        total_assignments: 0,
        completed_quizzes: 0,
        total_quizzes: 0
      };
    } catch (error) {
      return {
        overall_percentage: 0,
        completed_lectures: 0,
        total_lectures: 0,
        completed_modules: 0,
        total_modules: 0,
        completed_assignments: 0,
        total_assignments: 0,
        completed_quizzes: 0,
        total_quizzes: 0
      };
    }
  }

  static async fetchAllProgress(userId: string, courseId: string): Promise<ProgressData> {
    try {
      // Fetch all progress data
      const [lectureRes, moduleRes, assignmentRes, quizRes] = await Promise.all([
        supabase
          .from('user_lecture_progress')
          .select('lecture_id, watched')
          .eq('user_id', userId)
          .eq('course_id', courseId),
        supabase
          .from('user_module_progress')
          .select('module_id, completed')
          .eq('user_id', userId)
          .eq('course_id', courseId),
        supabase
          .from('user_assignment_progress')
          .select('assignment_id, completed')
          .eq('user_id', userId)
          .eq('course_id', courseId),
        supabase
          .from('user_quiz_progress')
          .select('quiz_id, completed, score, max_score')
          .eq('user_id', userId)
          .eq('course_id', courseId)
      ]);

      const lectureProgress: Record<string, boolean> = {};
      lectureRes.data?.forEach(item => {
        lectureProgress[item.lecture_id] = item.watched;
      });

      const moduleProgress: Record<string, boolean> = {};
      moduleRes.data?.forEach(item => {
        moduleProgress[item.module_id] = item.completed;
      });

      const assignmentProgress: Record<string, boolean> = {};
      assignmentRes.data?.forEach(item => {
        assignmentProgress[item.assignment_id] = item.completed;
      });

      const quizProgress: Record<string, { completed: boolean; score?: number; maxScore?: number }> = {};
      quizRes.data?.forEach(item => {
        quizProgress[item.quiz_id] = {
          completed: item.completed,
          score: item.score,
          maxScore: item.max_score
        };
      });

      return {
        lectureProgress,
        moduleProgress,
        assignmentProgress,
        quizProgress
      };
    } catch (error) {
      return {
        lectureProgress: {},
        moduleProgress: {},
        assignmentProgress: {},
        quizProgress: {}
      };
    }
  }

  static async markLectureAsWatched(userId: string, courseId: string, lectureId: string) {
    try {
      const { error } = await supabase
        .from('user_lecture_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          lecture_id: lectureId,
          watched: true,
          watched_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  static async markModuleAsRead(userId: string, courseId: string, moduleId: string) {
    try {
      const { error } = await supabase
        .from('user_module_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          module_id: moduleId,
          completed: true,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  static async markAssignmentAsRead(userId: string, courseId: string, assignmentId: string) {
    try {
      const { error } = await supabase
        .from('user_assignment_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          assignment_id: assignmentId,
          completed: true,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  static async markQuizAsCompleted(userId: string, courseId: string, quizId: string, score: number, maxScore: number) {
    try {
      const { error } = await supabase
        .from('user_quiz_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          quiz_id: quizId,
          completed: true,
          score: score,
          max_score: maxScore,
          last_attempt_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }
}