import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST() {
  try {
    // Check if user is authenticated
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // This endpoint provides instructions for clearing offline storage
    // The actual clearing needs to be done in the browser since it's client-side
    
    return NextResponse.json({ 
      message: 'Offline storage clearing instructions',
      instructions: [
        'Open browser developer tools (F12)',
        'Go to Application tab → Storage → IndexedDB',
        'Delete the "BatteryTechOffline" database',
        'Or run this in the browser console:',
        'indexedDB.deleteDatabase("BatteryTechOffline")'
      ],
      note: 'Offline storage clearing must be done in the browser'
    })
    
  } catch (error) {
    console.error('Error providing offline storage instructions:', error)
    return NextResponse.json({ 
      error: 'Failed to provide instructions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
