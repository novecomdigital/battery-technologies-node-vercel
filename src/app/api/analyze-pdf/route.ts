import { NextRequest, NextResponse } from 'next/server'
import { analyzePDFTemplate } from '@/lib/pdf-template-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templatePath = searchParams.get('path') || '/999999_ServiceSheet.pdf'
    
    const analysis = await analyzePDFTemplate(templatePath)
    
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing PDF template:', error)
    return NextResponse.json(
      { error: 'Failed to analyze PDF template' },
      { status: 500 }
    )
  }
}
