import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { uploadFile, uploadFileLocal, deleteFile, deleteFileLocal } from '@/lib/cloud-storage'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: jobId } = await params

    const photos = await prisma.jobPhoto.findMany({
      where: { jobId },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(photos)
  } catch (error) {
    console.error('Error fetching job photos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: jobId } = await params

    const formData = await req.formData()
    const file = formData.get('file') as File
    const caption = formData.get('caption') as string
    const isPrimary = formData.get('isPrimary') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate unique filename
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    // Upload to cloud storage (R2) or local storage for development
    let uploadResult
    if (process.env.CLOUDFLARE_R2_BUCKET_NAME) {
      // Use Cloudflare R2
      uploadResult = await uploadFile(file, filename)
    } else {
      // Use local storage for development
      uploadResult = await uploadFileLocal(file, filename)
    }

    const url = uploadResult.url

    const photo = await prisma.jobPhoto.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url,
        caption,
        isPrimary,
        jobId
      }
    })

    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    console.error('Error uploading job photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: jobId } = await params
    const { searchParams } = new URL(req.url)
    const photoId = searchParams.get('photoId')

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
    }

    // Find the photo to get the filename for deletion
    const photo = await prisma.jobPhoto.findFirst({
      where: {
        id: photoId,
        jobId: jobId
      }
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Delete from cloud storage (R2) or local storage
    try {
      if (process.env.CLOUDFLARE_R2_BUCKET_NAME) {
        // Use Cloudflare R2
        await deleteFile(photo.filename)
      } else {
        // Use local storage for development
        await deleteFileLocal(photo.filename)
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.jobPhoto.delete({
      where: {
        id: photoId
      }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting job photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
