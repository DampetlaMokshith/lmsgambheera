import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'courseSection',
  title: 'Course Section',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
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
      title: 'Section Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'order',
      title: 'Section Order',
      type: 'number',
      validation: Rule => Rule.required().min(1),
      description: 'Order of this section in the course'
    }),
    defineField({
      name: 'lectures',
      title: 'Lectures',
      type: 'array',
      of: [{
        type: 'reference',
        to: {type: 'lecture'},
        options: {
          filter: 'defined(title)'
        }
      }],
      description: 'Add lectures to this section'
    }),
    defineField({
      name: 'quiz',
      title: 'Section Quiz',
      type: 'reference',
      to: {type: 'quiz'},
      description: 'Optional quiz for this section'
    }),
    defineField({
      name: 'assignments',
      title: 'Assignments',
      type: 'array',
      of: [{
        type: 'reference',
        to: {type: 'assignment'},
        options: {
          filter: 'defined(title)'
        }
      }],
      description: 'Assignments for this section'
    }),
    defineField({
      name: 'modules',
      title: 'Study Modules',
      type: 'array',
      of: [{
        type: 'reference',
        to: {type: 'module'},
        options: {
          filter: 'defined(title)'
        }
      }],
      description: 'Additional study materials for this section'
    }),
    defineField({
      name: 'learningObjectives',
      title: 'Learning Objectives',
      type: 'array',
      of: [{type: 'string'}],
      description: 'What students will learn in this section'
    }),
    defineField({
      name: 'estimatedDuration',
      title: 'Estimated Duration (hours)',
      type: 'number',
      validation: Rule => Rule.min(0.5).max(50),
      description: 'How long this section should take to complete'
    }),
    defineField({
      name: 'isActive',
      title: 'Section Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'prerequisiteSection',
      title: 'Prerequisite Section',
      type: 'reference',
      to: {type: 'courseSection'},
      description: 'Section that must be completed before this one'
    }),
  ],
  preview: {
    select: {
      title: 'title',
      order: 'order',
      lectureCount: 'lectures',
      estimatedDuration: 'estimatedDuration'
    },
    prepare({title, order, lectureCount, estimatedDuration}) {
      const count = Array.isArray(lectureCount) ? lectureCount.length : 0
      const duration = estimatedDuration ? `${estimatedDuration}h` : 'No duration'
      return {
        title: `${order || '?'}. ${title || 'Untitled Section'}`,
        subtitle: `${count} lectures • ${duration}`
      }
    }
  },
  orderings: [
    {
      title: 'Section Order',
      name: 'order',
      by: [
        {field: 'order', direction: 'asc'}
      ]
    }
  ]
})