export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03'

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET'
)

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ,
  'Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID'
)

export const useCdn = false // Always disable CDN for consistent behavior

export const token = process.env.SANITY_API_TOKEN || process.env.SANITY_API_WRITE_TOKEN

export const readToken = process.env.NEXT_PUBLIC_SANITY_READ_TOKEN

export const editorToken = process.env.NEXT_PUBLIC_SANITY_EDITOR_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_API_WRITE_TOKEN

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }

  return v
}
