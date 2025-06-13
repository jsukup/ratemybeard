import { NextResponse } from 'next/server';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';

/**
 * Health check endpoint for the ensemble API route
 */
export async function GET() {
  try {
    // Check TensorFlow.js status
    let tfBackend = 'not initialized';
    let tfStatus = 'unavailable';
    
    try {
      tfBackend = tf.getBackend() || 'none';
      tfStatus = 'available';
    } catch (tfError) {
      console.error('Error checking TF backend:', tfError);
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      tensorflow: {
        status: tfStatus,
        backend: tfBackend
      },
      env: process.env.NODE_ENV,
      models: {
        scut_url_configured: !!process.env.SCUT_MODEL_SERVER_URL,
        mebeauty_url_configured: !!process.env.MEBEAUTY_MODEL_SERVER_URL,
        force_mock_mode: true // This should match the setting in serverModelLoader.ts
      }
    });
  } catch (error) {
    console.error('Error in ensemble health check endpoint:', error);
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 