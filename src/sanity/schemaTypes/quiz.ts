import {defineField, defineType} from 'sanity'

// Quiz Question Object Type
export const quizQuestion = defineType({
  name: 'quizQuestion',
  title: 'Quiz Question',
  type: 'object',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'text',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'options',
      title: 'Answer Options',
      type: 'array',
      of: [{type: 'string'}],
      validation: Rule => Rule.required().min(2).max(4),
      options: {
        layout: 'list'
      }
    }),
    defineField({
      name: 'correctAnswer',
      title: 'Correct Answer Index (0-based)',
      type: 'number',
      validation: Rule => Rule.required().min(0).max(3),
      description: 'Enter 0 for first option, 1 for second, etc.'
    }),
    defineField({
      name: 'explanation',
      title: 'Explanation (Optional)',
      type: 'text',
      rows: 2,
      description: 'Explain why this is the correct answer'
    }),
  ],
  preview: {
    select: {
      title: 'question',
      options: 'options',
      correctAnswer: 'correctAnswer'
    },
    prepare({title, options, correctAnswer}) {
      const correctOption = options?.[correctAnswer] || 'Not set'
      return {
        title: title || 'Untitled Question',
        subtitle: `Correct: ${correctOption}`
      }
    }
  }
})

// Main Quiz Schema
export default defineType({
  name: 'quiz',
  title: 'Quiz',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Quiz Title',
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
    }),
    defineField({
      name: 'description',
      title: 'Quiz Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'timeLimit',
      title: 'Time Limit (minutes)',
      type: 'number',
      initialValue: 30,
      validation: Rule => Rule.min(1).max(180)
    }),
    defineField({
      name: 'passingScore',
      title: 'Passing Score (%)',
      type: 'number',
      initialValue: 70,
      validation: Rule => Rule.min(1).max(100)
    }),
    defineField({
      name: 'questions',
      title: 'Quiz Questions',
      type: 'array',
      of: [{type: 'quizQuestion'}],
      validation: Rule => Rule.required().min(1).max(50),
    }),
    defineField({
      name: 'instructions',
      title: 'Quiz Instructions',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Instructions for students before taking the quiz'
    }),
    defineField({
      name: 'allowRetakes',
      title: 'Allow Retakes',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'maxAttempts',
      title: 'Maximum Attempts',
      type: 'number',
      initialValue: 3,
      validation: Rule => Rule.min(1).max(10),
      hidden: ({document}) => !document?.allowRetakes
    }),
    defineField({
      name: 'showCorrectAnswers',
      title: 'Show Correct Answers After Submission',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'isActive',
      title: 'Quiz Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      questionCount: 'questions',
      timeLimit: 'timeLimit'
    },
    prepare({title, questionCount, timeLimit}) {
      const count = questionCount?.length || 0
      return {
        title: title || 'Untitled Quiz',
        subtitle: `${count} questions • ${timeLimit || 30} minutes`
      }
    }
  }
})