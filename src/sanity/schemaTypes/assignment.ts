import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'assignment',
  title: 'Assignment',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Assignment Title',
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
      title: 'Assignment Description',
      type: 'array',
      of: [{type: 'block'}],
      validation: Rule => Rule.required(),
      description: 'Detailed description of what students need to do'
    }),
    defineField({
      name: 'instructions',
      title: 'Instructions',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Step-by-step instructions for completing the assignment'
    }),
    defineField({
      name: 'attachments',
      title: 'Assignment Files & Resources',
      type: 'array',
      of: [
        {
          type: 'file',
          options: {
            accept: '.pdf,.doc,.docx,.txt,.zip'
          }
        },
        {
          type: 'image',
          options: {
            hotspot: true,
          }
        }
      ],
      description: 'Files, documents, or images students might need'
    }),
    defineField({
      name: 'submissionType',
      title: 'Submission Type',
      type: 'string',
      options: {
        list: [
          {title: 'File Upload', value: 'file'},
          {title: 'Text Submission', value: 'text'},
          {title: 'Both File and Text', value: 'both'},
          {title: 'External Link', value: 'link'}
        ],
      },
      initialValue: 'file',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'allowedFileTypes',
      title: 'Allowed File Types',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'PDF (.pdf)', value: 'pdf'},
          {title: 'Word Document (.doc, .docx)', value: 'doc'},
          {title: 'Text File (.txt)', value: 'txt'},
          {title: 'Image (.jpg, .png)', value: 'image'},
          {title: 'Archive (.zip, .rar)', value: 'archive'},
          {title: 'Code Files (.js, .py, .java)', value: 'code'}
        ]
      },
      hidden: ({document}) => document?.submissionType === 'text'
    }),
    defineField({
      name: 'maxFileSize',
      title: 'Maximum File Size (MB)',
      type: 'number',
      initialValue: 10,
      validation: Rule => Rule.min(1).max(100),
      hidden: ({document}) => document?.submissionType === 'text'
    }),
    defineField({
      name: 'dueDate',
      title: 'Due Date',
      type: 'datetime',
      description: 'When the assignment is due'
    }),
    defineField({
      name: 'totalPoints',
      title: 'Total Points',
      type: 'number',
      initialValue: 100,
      validation: Rule => Rule.min(1).max(1000)
    }),
    defineField({
      name: 'rubric',
      title: 'Grading Rubric',
      type: 'array',
      of: [{type: 'block'}],
      description: 'How the assignment will be graded'
    }),
    defineField({
      name: 'isGroupAssignment',
      title: 'Group Assignment',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'maxGroupSize',
      title: 'Maximum Group Size',
      type: 'number',
      initialValue: 3,
      validation: Rule => Rule.min(2).max(10),
      hidden: ({document}) => !document?.isGroupAssignment
    }),
    defineField({
      name: 'isActive',
      title: 'Assignment Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true
    }),
  ],
  preview: {
    select: {
      title: 'title',
      dueDate: 'dueDate',
      totalPoints: 'totalPoints'
    },
    prepare({title, dueDate, totalPoints}) {
      const due = dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'
      return {
        title: title || 'Untitled Assignment',
        subtitle: `${totalPoints || 100} points • Due: ${due}`
      }
    }
  }
})