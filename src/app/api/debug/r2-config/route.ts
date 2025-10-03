import { NextResponse } from 'next/server'
import { testR2Configuration } from '@/lib/cloud-storage'

export async function GET() {
  try {
    const config = await testR2Configuration()
    
    return NextResponse.json({
      ...config,
      // Don't expose actual keys, just whether they exist
      message: config.isConfigured 
        ? 'R2 is configured' 
        : 'R2 is not configured - using local storage'
    })
  } catch (error) {
    console.error('Error testing R2 configuration:', error)
    return NextResponse.json({ 
      error: 'Failed to test R2 configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
