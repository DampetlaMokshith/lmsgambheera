import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, token, readToken, editorToken } from '../env'

// Create configuration for client
const baseConfig = {
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Disable CDN for authenticated queries
}

// Client for read operations (with read token for authenticated queries)
export const client = createClient({
  ...baseConfig,
  token: readToken || token, // Use read token first, fallback to write token
  perspective: 'published', // Use published perspective for read operations
  ignoreBrowserTokenWarning: true,
  withCredentials: false, // Explicitly set credentials handling
})

// Client for server-side operations (with write token)
export const writeClient = createClient({
  ...baseConfig,
  token, // Use the write token from environment
  perspective: 'previewDrafts', // Use previewDrafts for write operations
  ignoreBrowserTokenWarning: true,
  withCredentials: false, // Explicitly set credentials handling
})

// Client for browser-side editor operations (with editor token)
// Browser-side client with editor token for mutations
export const editorClient = createClient({
  ...baseConfig,
  token: editorToken,
  useCdn: false, // Always use direct access for mutations
  ignoreBrowserTokenWarning: true
});

// Debug logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Sanity Client Configuration:', {
    projectId: projectId ? '✅ Set' : '❌ Missing',
    dataset: dataset ? '✅ Set' : '❌ Missing',
    apiVersion: apiVersion ? '✅ Set' : '❌ Missing',
    hasReadToken: !!readToken,
    hasWriteToken: !!token,
    hasEditorToken: !!editorToken,
  });
}
