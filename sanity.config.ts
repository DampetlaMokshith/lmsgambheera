'use client'

/**
 * This configuration is used to for the Sanity Studio that's mounted on the `\src\app\studio\[[...tool]]\page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {codeInput} from '@sanity/code-input'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './src/sanity/env'
import {schema} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  plugins: [
    structureTool({structure}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
    // Code input plugin for syntax highlighting
    codeInput(),
  ],
  
  // CORS configuration
  cors: {
    origin: [
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://localhost:3002', 
      'https://localhost:3000', 
      'https://localhost:3001', 
      'https://localhost:3002',
      // Production URLs - will be added automatically by Sanity
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/lmsgambheera\.vercel\.app$/,
    ],
    credentials: true
  },
  
  // Studio configuration
  title: 'THREADLMS Studio',
  
  // Environment configuration
  useCdn: false, // Set to false for development
  
  // API configuration
  apiVersion,
})
