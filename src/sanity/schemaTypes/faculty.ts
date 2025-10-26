import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'faculty',
  title: 'Faculty',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.required().email()
    }),
    defineField({
      name: 'supabaseId',
      title: 'Supabase User ID',
      type: 'string',
      description: 'UUID from Supabase auth.users table'
    }),
    defineField({
      name: 'profileImage',
      title: 'Profile Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'profession',
      title: 'Profession',
      type: 'string',
    }),
    defineField({
      name: 'about',
      title: 'About',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'skilledAt',
      title: 'Skilled At',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags'
      }
    }),
    defineField({
      name: 'college',
      title: 'College',
      type: 'string',
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
    }),
    defineField({
      name: 'gender',
      title: 'Gender',
      type: 'string',
      options: {
        list: [
          {title: 'Male', value: 'male'},
          {title: 'Female', value: 'female'},
          {title: 'Other', value: 'other'},
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'profession',
      media: 'profileImage'
    }
  }
})