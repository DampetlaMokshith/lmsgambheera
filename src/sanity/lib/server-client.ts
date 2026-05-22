import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId, token } from '../env'

// Server-side only writeClient with enhanced configuration
export const serverWriteClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token, // Use the full write token
  perspective: 'raw', // Use raw perspective for direct database access
  ignoreBrowserTokenWarning: true,
  // Additional configuration for better error handling
  requestTagPrefix: 'faculty-edit',
  stega: false,
})

// Utility function to validate writeClient permissions
export async function validateWritePermissions() {
  try {
    // Try a simple query to test permissions
    const testQuery = `*[_type == "course"][0...1] { _id, title }`;
    await serverWriteClient.fetch(testQuery);
    return true;
  } catch (error) {
    return false;
  }
}

// Enhanced patch function with better error handling
export async function patchCourse(courseId: string, updateData: Record<string, unknown>) {
  try {
    // First validate permissions
    const hasPermissions = await validateWritePermissions();
    if (!hasPermissions) {
      throw new Error('Insufficient permissions for write operations');
    }

    // Perform the patch operation
    const result = await serverWriteClient
      .patch(courseId)
      .set(updateData)
      .commit();
    
    return result;
  } catch (error) {
    // Enhanced error reporting
    if (error instanceof Error) {
      if (error.message.includes('Insufficient permissions')) {
        throw new Error('Insufficient permissions: The API token does not have write access to this dataset');
      } else if (error.message.includes('Not found')) {
        throw new Error('Course not found or has been deleted');
      } else if (error.message.includes('Invalid token')) {
        throw new Error('Invalid or expired API token');
      }
    }
    
    throw error;
  }
}