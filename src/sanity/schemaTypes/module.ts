import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'module',
  title: 'Study Module',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Module Title',
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
      title: 'Module Description',
      type: 'text',
      rows: 3,
      description: 'Brief description of what this module covers'
    }),
    defineField({
      name: 'moduleType',
      title: 'Module Type',
      type: 'string',
      options: {
        list: [
          {title: 'PDF Document', value: 'pdf'},
          {title: 'Rich Text Content', value: 'content'},
          {title: 'External Link', value: 'link'},
          {title: 'Video Resource', value: 'video'}
        ],
      },
      initialValue: 'pdf',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'file',
      title: 'Module File (PDF)',
      type: 'file',
      options: {
        accept: '.pdf'
      },
      validation: Rule => Rule.custom((file, context) => {
        const moduleType = context.document?.moduleType
        if (moduleType === 'pdf' && !file) {
          return 'PDF file is required when module type is PDF'
        }
        return true
      }),
      hidden: ({document}) => document?.moduleType !== 'pdf'
    }),
    defineField({
      name: 'content',
      title: 'Module Content',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'}
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'}
            ],
          }
        },
        {
          type: 'image',
          options: {hotspot: true}
        },
        {
          name: 'codeBlock',
          title: 'Code Block',
          type: 'code',
          options: {
            language: 'javascript',
            languageAlternatives: [
              {title: 'JavaScript', value: 'javascript'},
              {title: 'TypeScript', value: 'typescript'},
              {title: 'Python', value: 'python'},
              {title: 'Java', value: 'java'},
              {title: 'C++', value: 'cpp'},
              {title: 'C', value: 'c'},
              {title: 'HTML', value: 'html'},
              {title: 'CSS', value: 'css'},
              {title: 'SQL', value: 'sql'},
              {title: 'JSON', value: 'json'},
              {title: 'XML', value: 'xml'},
              {title: 'Shell', value: 'sh'}
            ],
            withFilename: true
          }
        }
      ],
      validation: Rule => Rule.custom((content, context) => {
        const moduleType = context.document?.moduleType
        if (moduleType === 'content' && (!content || content.length === 0)) {
          return 'Content is required when module type is Rich Text Content'
        }
        return true
      }),
      hidden: ({document}) => document?.moduleType !== 'content'
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      validation: Rule => Rule.custom((url, context) => {
        const moduleType = context.document?.moduleType
        if ((moduleType === 'link' || moduleType === 'video') && !url) {
          return 'URL is required for external links and videos'
        }
        return true
      }),
      hidden: ({document}) => {
        const moduleType = document?.moduleType as string
        return !['link', 'video'].includes(moduleType || '')
      }
    }),
    defineField({
      name: 'estimatedReadTime',
      title: 'Estimated Read/Study Time (minutes)',
      type: 'number',
      validation: Rule => Rule.min(1).max(300),
      description: 'How long it should take to complete this module'
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty Level',
      type: 'string',
      options: {
        list: [
          {title: 'Beginner', value: 'beginner'},
          {title: 'Intermediate', value: 'intermediate'},
          {title: 'Advanced', value: 'advanced'}
        ],
      },
      initialValue: 'beginner'
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags'
      },
      description: 'Topics covered in this module'
    }),
    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'array',
      of: [{type: 'string'}],
      description: 'What students should know before studying this module'
    }),
    defineField({
      name: 'learningObjectives',
      title: 'Learning Objectives',
      type: 'array',
      of: [{type: 'string'}],
      description: 'What students will learn after completing this module'
    }),
    defineField({
      name: 'isActive',
      title: 'Module Active',
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
      moduleType: 'moduleType',
      estimatedReadTime: 'estimatedReadTime',
      difficulty: 'difficulty'
    },
    prepare({title, moduleType, estimatedReadTime, difficulty}) {
      const typeLabels: Record<string, string> = {
        pdf: 'PDF',
        content: 'Content',
        link: 'Link',
        video: 'Video'
      }
      const typeLabel = typeLabels[moduleType as string] || 'Unknown'
      
      const timeText = estimatedReadTime ? `${estimatedReadTime}m` : 'No time set'
      return {
        title: title || 'Untitled Module',
        subtitle: `${typeLabel} • ${timeText} • ${difficulty || 'beginner'}`
      }
    }
  }
})