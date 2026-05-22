import { createClient, SanityClient, ClientConfig } from 'next-sanity';
import { apiVersion, dataset, projectId, token, readToken } from '../env';

// Create a wrapper for the Sanity client with retry logic
class SafeSanityClient {
  private client: SanityClient;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor(config: ClientConfig) {
    this.client = createClient(config);
  }

  async fetch(query: string, params?: Record<string, unknown>, options?: Record<string, unknown>): Promise<unknown> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.client.fetch(query, params, options);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain types of errors
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (errorMessage.includes('unauthorized') || 
              errorMessage.includes('forbidden') || 
              errorMessage.includes('invalid token')) {
            throw error;
          }
        }
        
        // Wait before retrying (except on last attempt)
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          this.retryDelay *= 2; // Exponential backoff
        }
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error('Sanity fetch failed after all retries');
  }
}

// Create safe clients
export const safeClient = new SafeSanityClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: readToken || token,
  perspective: 'published',
  ignoreBrowserTokenWarning: true,
  withCredentials: false,
});

export const safeWriteClient = new SafeSanityClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
  perspective: 'previewDrafts',
  ignoreBrowserTokenWarning: true,
  withCredentials: false,
});

// Export regular clients as well for compatibility
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: readToken || token,
  perspective: 'published',
  ignoreBrowserTokenWarning: true,
  withCredentials: false,
});

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
  perspective: 'previewDrafts',
  ignoreBrowserTokenWarning: true,
  withCredentials: false,
});