import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Cloudflare R2 configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!

export interface UploadResult {
  url: string
  key: string
}

export async function uploadFile(
  file: File,
  key: string
): Promise<UploadResult> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ContentLength: file.size,
    })

    await r2Client.send(command)

    // Return the public URL
    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-e9be35a84de94387b6876cfdc423c997.r2.dev'
    // Ensure no trailing slash in publicUrl and no leading slash in key
    const cleanPublicUrl = publicUrl.replace(/\/$/, '')
    const cleanKey = key.replace(/^\//, '')
    const url = `${cleanPublicUrl}/${cleanKey}`
    
    console.log('📤 File uploaded successfully:', {
      key,
      publicUrl,
      fullUrl: url,
      bucketName: BUCKET_NAME
    })
    
    return { url, key }
  } catch (error) {
    console.error('Failed to upload file to R2:', error)
    throw new Error('Failed to upload file')
  }
}

export async function getFile(key: string): Promise<Buffer | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const response = await r2Client.send(command)
    
    if (!response.Body) {
      return null
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    const reader = response.Body.transformToWebStream().getReader()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    
    return Buffer.concat(chunks)
  } catch (error) {
    console.error('Failed to get file from R2:', error)
    return null
  }
}

export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await r2Client.send(command)
  } catch (error) {
    console.error('Failed to delete file from R2:', error)
    throw new Error('Failed to delete file')
  }
}

// Fallback to local storage for development
export async function uploadFileLocal(
  file: File,
  filename: string
): Promise<UploadResult> {
  const { writeFile, mkdir } = await import('fs/promises')
  const { join } = await import('path')
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'public', 'uploads')
  try {
    await mkdir(uploadsDir, { recursive: true })
  } catch {
    // Directory might already exist, that's fine
  }

  const filepath = join(uploadsDir, filename)
  
  // Save file to disk
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(filepath, buffer)

  // For local development, we need to use the full URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = `${baseUrl}/uploads/${filename}`
  
  return { url, key: filename }
}

export async function deleteFileLocal(filename: string): Promise<void> {
  try {
    const { unlink } = await import('fs/promises')
    const { join } = await import('path')
    
    const filepath = join(process.cwd(), 'public', 'uploads', filename)
    await unlink(filepath)
  } catch (error) {
    console.error('Failed to delete local file:', error)
    throw new Error('Failed to delete local file')
  }
}

// Diagnostic function to test R2 configuration
export async function testR2Configuration(): Promise<{
  isConfigured: boolean
  bucketName: string | null
  publicUrl: string | null
  endpoint: string | null
  hasAccessKey: boolean
  hasSecretKey: boolean
}> {
  return {
    isConfigured: !!process.env.CLOUDFLARE_R2_BUCKET_NAME,
    bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || null,
    publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL || null,
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || null,
    hasAccessKey: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  }
}
