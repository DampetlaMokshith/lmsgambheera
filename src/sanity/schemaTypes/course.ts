import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Course Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Course Description',
      type: 'text',
      rows: 5,
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'thumbnail',
      title: 'Course Thumbnail',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'previewVideo',
      title: 'Preview Video URL',
      type: 'url',
      description: 'YouTube, Vimeo, or direct video URL for course preview'
    }),
    defineField({
      name: 'degree',
      title: 'Degree',
      type: 'string',
      options: {
        list: [
          {title: 'B.Tech (Bachelor of Technology)', value: 'btech'},
          {title: 'M.Tech (Master of Technology)', value: 'mtech'},
          {title: 'MBA (Master of Business Administration)', value: 'mba'},
        ],
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'department',
      title: 'Department',
      type: 'string',
      options: {
        list: [
          {title: 'Computer Science & Engineering', value: 'cse'},
          {title: 'Electronics & Communication', value: 'ece'},
          {title: 'Mechanical Engineering', value: 'mech'},
          {title: 'Civil Engineering', value: 'civil'},
        ],
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'faculty',
      title: 'Course Instructor',
      type: 'reference',
      to: {type: 'faculty'},
      validation: Rule => Rule.required(),
      description: 'The faculty member teaching this course'
    }),
    defineField({
      name: 'language',
      title: 'Course Language',
      type: 'string',
      initialValue: 'English',
      options: {
        list: [
          {title: 'English', value: 'English'},
          {title: 'Hindi', value: 'Hindi'},
          {title: 'Telugu', value: 'Telugu'},
          {title: 'Tamil', value: 'Tamil'},
        ],
      }
    }),
    defineField({
      name: 'subtitles',
      title: 'Subtitles Available',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'level',
      title: 'Course Level',
      type: 'string',
      options: {
        list: [
          {title: 'Beginner', value: 'beginner'},
          {title: 'Intermediate', value: 'intermediate'},
          {title: 'Advanced', value: 'advanced'},
        ],
      },
      initialValue: 'beginner'
    }),
    defineField({
      name: 'price',
      title: 'Course Price (₹)',
      type: 'number',
      validation: Rule => Rule.min(0),
      initialValue: 0,
      description: 'Set to 0 for free courses'
    }),
    defineField({
      name: 'whatYouLearn',
      title: 'What You Will Learn',
      type: 'array',
      of: [{type: 'string'}],
      validation: Rule => Rule.required().min(3),
      description: 'Key learning outcomes for students'
    }),
    defineField({
      name: 'requirements',
      title: 'Course Requirements',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Prerequisites and requirements for the course'
    }),
    defineField({
      name: 'courseIncludes',
      title: 'This Course Includes',
      type: 'array',
      of: [{type: 'string'}],
      initialValue: [
        'Lifetime access',
        'Certificate of completion',
        'Downloadable resources'
      ],
      description: 'What students get with this course'
    }),
    defineField({
      name: 'sections',
      title: 'Course Sections',
      type: 'array',
      of: [{
        type: 'reference',
        to: {type: 'courseSection'},
        options: {
          filter: 'defined(title)'
        }
      }],
      description: 'Add sections to organize your course content'
    }),
    defineField({
      name: 'tags',
      title: 'Course Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags'
      },
      description: 'Topics and technologies covered in this course'
    }),
    defineField({
      name: 'estimatedDuration',
      title: 'Total Course Duration (hours)',
      type: 'number',
      validation: Rule => Rule.min(1).max(200),
      description: 'Estimated time to complete the entire course'
    }),
    defineField({
      name: 'difficultyLevel',
      title: 'Difficulty Rating (1-5)',
      type: 'number',
      validation: Rule => Rule.min(1).max(5),
      initialValue: 3
    }),
    defineField({
      name: 'rating',
      title: 'Course Rating (1-5)',
      type: 'number',
      validation: Rule => Rule.min(1).max(5),
      initialValue: 4.5,
      description: 'Average rating from student reviews'
    }),
    defineField({
      name: 'totalEnrollments',
      title: 'Total Enrollments',
      type: 'number',
      initialValue: 0,
      readOnly: true,
      description: 'Number of students enrolled (auto-updated from Supabase)'
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
      description: 'Make this course visible to students'
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured Course',
      type: 'boolean',
      initialValue: false,
      description: 'Show this course in featured section'
    }),
    defineField({
      name: 'enrollmentLimit',
      title: 'Enrollment Limit',
      type: 'number',
      validation: Rule => Rule.min(1),
      description: 'Maximum number of students who can enroll (leave empty for unlimited)'
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      description: 'When the course was first published'
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'marketData',
      title: 'Related Market Jobs & Internships',
      type: 'object',
      fields: [
        defineField({
          name: 'jobKeywords',
          title: 'Job Search Keywords',
          type: 'array',
          of: [{type: 'string'}],
          description: 'Keywords to search for related jobs on LinkedIn'
        }),
        defineField({
          name: 'careerPaths',
          title: 'Career Paths',
          type: 'array',
          of: [{type: 'string'}],
          description: 'Possible career paths after completing this course'
        })
      ],
      options: {
        collapsible: true,
        collapsed: true
      }
    }),
  ],
  preview: {
    select: {
      title: 'title',
      faculty: 'faculty.name',
      degree: 'degree',
      department: 'department',
      isPublished: 'isPublished',
      media: 'thumbnail'
    },
    prepare({title, faculty, degree, department, isPublished, media}) {
      const status = isPublished ? '✅' : '⏳'
      const degreeText = degree?.toUpperCase() || 'NO DEGREE'
      const deptText = department?.toUpperCase() || 'NO DEPT'
      return {
        title: `${status} ${title || 'Untitled Course'}`,
        subtitle: `${degreeText} ${deptText} • by ${faculty || 'No Instructor'}`,
        media
      }
    }
  },
  orderings: [
    {
      title: 'Created Date, New',
      name: 'createdDesc',
      by: [
        {field: 'createdAt', direction: 'desc'}
      ]
    },
    {
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [
        {field: 'title', direction: 'asc'}
      ]
    }
  ]
})