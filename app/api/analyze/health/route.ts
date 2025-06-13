import { NextResponse } from 'next/server';

/**
 * Health check endpoint to verify API routes are functioning
 */
export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      tensorflow_enabled: true,
      model_urls_configured: {
        scut: !!process.env.SCUT_MODEL_SERVER_URL,
        mebeauty: !!process.env.MEBEAUTY_MODEL_SERVER_URL
      }
    });
  } catch (error) {
    console.error('Error in health check endpoint:', error);
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 