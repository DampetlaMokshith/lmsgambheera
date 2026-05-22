// Utility functions for Sanity operations
import { client, writeClient } from './client'

// GROQ query for fetching published courses with all necessary data
export const COURSES_QUERY = `*[_type == "course" && isPublished == true] | order(publishedAt desc) {
  _id,
  title,
  description,
  slug,
  thumbnail {
    asset->{
      _id,
      _ref
    },
    alt
  },
  faculty->{
    name,
    profileImage {
      asset->{
        _id,
        _ref
      }
    }
  },
  rating,
  totalEnrollments,
  estimatedDuration,
  level,
  price,
  tags,
  isPublished,
  isFeatured,
  publishedAt,
  degree,
  department
}`

// Function to fetch all published courses
export async function getPublishedCourses() {
  try {
    const courses = await client.fetch(COURSES_QUERY)
    return courses
  } catch (error) {
    throw error
  }
}

// Function to fetch courses filtered by degree and department
export async function getCoursesByDegreeAndDepartment(degree: string, department: string) {
  try {
    const query = `*[_type == "course" && isPublished == true && degree == $degree && department == $department] | order(publishedAt desc) {
      _id,
      title,
      description,
      slug,
      thumbnail {
        asset->{
          _id,
          _ref
        },
        alt
      },
      faculty->{
        name,
        profileImage {
          asset->{
            _id,
            _ref
          }
        }
      },
      rating,
      totalEnrollments,
      estimatedDuration,
      level,
      price,
      tags,
      isPublished,
      isFeatured,
      publishedAt,
      degree,
      department
    }`
    
    const courses = await client.fetch(query, { degree, department })
    return courses
  } catch (error) {
    throw error
  }
}

// Types for better type safety
interface CourseData {
  title: string
  description: string
  degree: string
  department: string
  faculty: { _ref: string }
  [key: string]: unknown
}

interface QuizData {
  title: string
  questions: Array<{
    question: string
    options: string[]
    correctAnswer: number
  }>
  [key: string]: unknown
}

interface AssignmentData {
  title: string
  description: unknown[]
  [key: string]: unknown
}

interface ModuleData {
  title: string
  moduleType: string
  [key: string]: unknown
}

// Function to create or update course in Sanity when faculty publishes
export async function createOrUpdateCourse(courseData: CourseData & { _id?: string }) {
  try {
    if (courseData._id) {
      // Update existing course
      const { _id, ...updateData } = courseData
      const result = await writeClient.createOrReplace({
        _id,
        _type: 'course',
        ...updateData,
        updatedAt: new Date().toISOString(),
      })
      return result
    } else {
      // Create new course
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...createData } = courseData
      const result = await writeClient.create({
        _type: 'course',
        ...createData,
        updatedAt: new Date().toISOString(),
      })
      return result
    }
  } catch (error) {
    throw error
  }
}

// Function to create quiz questions from AI
export async function createQuiz(quizData: QuizData) {
  try {
    const result = await writeClient.create({
      _type: 'quiz',
      ...quizData,
    })
    return result
  } catch (error) {
    throw error
  }
}

// Function to create assignment
export async function createAssignment(assignmentData: AssignmentData) {
  try {
    const result = await writeClient.create({
      _type: 'assignment',
      ...assignmentData,
    })
    return result
  } catch (error) {
    throw error
  }
}

// Function to create module
export async function createModule(moduleData: ModuleData) {
  try {
    const result = await writeClient.create({
      _type: 'module',
      ...moduleData,
    })
    return result
  } catch (error) {
    throw error
  }
}

// Function to get courses by degree and department
export async function getCoursesByDegreeAndDept(degree: string, department: string) {
  try {
    const query = `*[_type == "course" && degree == $degree && department == $department && isPublished == true] {
      _id,
      title,
      slug,
      description,
      thumbnail,
      faculty->{
        name,
        profession,
        profileImage
      },
      level,
      estimatedDuration,
      tags,
      sections[]->{
        _id,
        title,
        lectures[]->{
          _id,
          title,
          duration
        }
      }
    }`
    
    const courses = await client.fetch(query, { degree, department })
    return courses
  } catch (error) {
    throw error
  }
}

// Function to get single course with all details
export async function getCourseBySlug(slug: string) {
  try {
    const query = `*[_type == "course" && slug.current == $slug && isPublished == true][0] {
      _id,
      title,
      slug,
      description,
      thumbnail,
      previewVideo,
      degree,
      department,
      language,
      subtitles,
      level,
      price,
      whatYouLearn,
      requirements,
      courseIncludes,
      estimatedDuration,
      faculty->{
        _id,
        name,
        profession,
        about,
        skilledAt,
        profileImage
      },
      sections[]->{
        _id,
        title,
        description,
        order,
        estimatedDuration,
        lectures[]->{
          _id,
          title,
          slug,
          videoUrl,
          duration,
          description,
          order,
          isPreview
        },
        "quizzes": select(
          defined(quiz) => [quiz->{
            _id,
            title,
            description,
            timeLimit,
            passingScore,
            questions
          }],
          []
        ),
        assignments[]->{
          _id,
          title,
          description,
          dueDate,
          totalPoints,
          attachments[] {
            asset->{
              _id,
              _ref,
              url
            }
          },
          order
        },
        modules[]->{
          _id,
          title,
          description,
          moduleType,
          file {
            asset->{
              _id,
              _ref,
              url
            }
          },
          estimatedReadTime,
          difficulty,
          tags,
          learningObjectives,
          order
        }
      },
      tags,
      marketData,
      publishedAt,
      updatedAt
    }`
    
    const course = await client.fetch(query, { slug })
    return course
  } catch (error) {
    throw error
  }
}

// Function to get single course by ID with all details
export async function getCourseById(courseId: string) {
  try {
    const query = `*[_type == "course" && _id == $courseId && isPublished == true][0] {
      _id,
      title,
      slug,
      description,
      thumbnail,
      previewVideo,
      degree,
      department,
      language,
      subtitles,
      level,
      price,
      whatYouLearn,
      requirements,
      courseIncludes,
      estimatedDuration,
      faculty->{
        _id,
        name,
        profession,
        about,
        skilledAt,
        profileImage
      },
      sections[]->{
        _id,
        title,
        description,
        order,
        estimatedDuration,
        lectures[]->{
          _id,
          title,
          slug,
          videoUrl,
          duration,
          description,
          order,
          isPreview
        },
        "quizzes": select(
          defined(quiz) => [quiz->{
            _id,
            title,
            description,
            timeLimit,
            passingScore,
            questions
          }],
          []
        ),
        assignments[]->{
          _id,
          title,
          description,
          dueDate,
          totalPoints,
          attachments[] {
            asset->{
              _id,
              _ref,
              url
            }
          },
          order
        },
        modules[]->{
          _id,
          title,
          description,
          moduleType,
          file {
            asset->{
              _id,
              _ref,
              url
            }
          },
          estimatedReadTime,
          difficulty,
          tags,
          learningObjectives,
          order
        }
      },
      tags,
      marketData,
      publishedAt,
      updatedAt
    }`
    
    const course = await client.fetch(query, { courseId })
    return course
  } catch (error) {
    throw error
  }
}

// Function to get faculty courses for their dashboard
export async function getFacultyCourses(facultyId: string) {
  try {
    const query = `*[_type == "course" && faculty._ref == $facultyId] {
      _id,
      title,
      slug,
      description,
      thumbnail,
      isPublished,
      sections[]->{
        _id,
        title,
        lectures
      },
      createdAt,
      updatedAt
    }`
    
    const courses = await client.fetch(query, { facultyId })
    return courses
  } catch (error) {
    throw error
  }
}

// Function to fetch related courses from same degree and department, excluding current course
export async function getRelatedCourses(degree: string, department: string, excludeCourseId: string, limit: number = 6) {
  try {
    const query = `*[_type == "course" && isPublished == true && degree == $degree && department == $department && _id != $excludeCourseId] | order(publishedAt desc)[0...$limit] {
      _id,
      title,
      description,
      slug,
      thumbnail {
        asset->{
          _id,
          _ref
        },
        alt
      },
      faculty->{
        name,
        profileImage {
          asset->{
            _id,
            _ref
          }
        }
      },
      rating,
      totalEnrollments,
      estimatedDuration,
      level,
      price,
      tags,
      isPublished,
      isFeatured,
      publishedAt,
      degree,
      department
    }`
    
    const courses = await client.fetch(query, { degree, department, excludeCourseId, limit })
    return courses
  } catch (error) {
    throw error
  }
}