import { NextResponse } from 'next/server';
import { writeClient as sanityClient } from '@/sanity/lib/client';

export async function POST() {
  try {
    console.log('🔧 Creating test course in Sanity...');
    
    // First, let's create a faculty document
    const faculty = await sanityClient.create({
      _type: 'faculty',
      name: 'Dr. John Smith',
      email: 'john.smith@university.edu',
      bio: 'Professor of Computer Science with 15+ years of experience',
      avatar: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: 'image-placeholder' // We'll use a placeholder
        }
      }
    });

    console.log('✅ Faculty created:', faculty._id);

    // Now create a test course
    const course = await sanityClient.create({
      _type: 'course',
      title: 'Python Programming: From Beginner to Pro',
      slug: {
        _type: 'slug',
        current: 'python-programming-from-beginner-to-pro'
      },
      description: 'This comprehensive course is designed to take you from zero programming knowledge to a confident Python developer, ready to build real-world applications. Whether you\'re aiming to start a new career in tech, automate repetitive tasks, or analyze data, this course is your first step toward success. We\'ll start with the fundamentals, covering everything from variables and data types to loops and conditional statements. You\'ll then master more advanced concepts, including functions, object-oriented programming (OOP), and file handling. Through a series of hands-on projects and coding exercises, you\'ll learn how to write clean, efficient, and powerful Python code.',
      thumbnail: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: 'image-placeholder' // We'll use a placeholder
        }
      },
      faculty: {
        _type: 'reference',
        _ref: faculty._id
      },
      price: 0,
      category: 'Programming',
      difficulty: 'beginner',
      duration: 60, // hours
      rating: 4,
      totalEnrollments: 10,
      estimatedDuration: 60,
      level: 'beginner',
      tags: ['Python', 'Programming', 'Beginner', 'Computer Science'],
      degree: 'BTECH',
      department: 'CSE',
      language: 'English',
      isPublished: true,
      isFeatured: false,
      publishedAt: new Date().toISOString(),
      prerequisites: ['Basic computer skills'],
      objectives: [
        'Master Python fundamentals',
        'Build real-world applications',
        'Understand object-oriented programming',
        'Handle files and data effectively'
      ]
    });

    console.log('✅ Course created:', course._id);

    return NextResponse.json({
      success: true,
      message: 'Test course created successfully',
      data: {
        faculty: {
          id: faculty._id,
          name: faculty.name
        },
        course: {
          id: course._id,
          title: course.title,
          slug: course.slug.current
        }
      }
    });

  } catch (error) {
    console.error('Error creating test course:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create test course'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test course creation endpoint. Use POST to create a test course in Sanity.',
    usage: {
      method: 'POST',
      description: 'Creates a test faculty and course in Sanity for testing the sync'
    }
  });
}