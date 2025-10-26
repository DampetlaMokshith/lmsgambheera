import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'lecture',
  title: 'Lecture',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Lecture Title',
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
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      validation: Rule => Rule.required(),
      description: 'YouTube, Vimeo, or direct video URL'
    }),
    defineField({
      name: 'duration',
      title: 'Duration (in minutes)',
      type: 'number',
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'order',
      title: 'Order in Section',
      type: 'number',
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: 'thumbnail',
      title: 'Video Thumbnail',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'isPreview',
      title: 'Free Preview',
      type: 'boolean',
      initialValue: false,
      description: 'Allow students to watch this lecture without enrolling'
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'duration',
      media: 'thumbnail'
    },
    prepare({title, subtitle, media}) {
      return {
        title,
        subtitle: subtitle ? `${subtitle} minutes` : 'No duration set',
        media
      }
    }
  },
  orderings: [
    {
      title: 'Order',
      name: 'order',
      by: [
        {field: 'order', direction: 'asc'}
      ]
    }
  ]
})