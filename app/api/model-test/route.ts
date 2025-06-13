import { NextRequest, NextResponse } from 'next/server';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import { loadLayersModel } from '@tensorflow/tfjs-layers';

// Set duration to allow for model loading
export const maxDuration = 30; // 30 seconds max

export async function GET(request: NextRequest) {
  try {
    console.log('Testing model loading in Vercel environment');
    
    // Initialize TensorFlow
    if (!tf.getBackend()) {
      await tf.setBackend('cpu');
      await tf.ready();
      console.log('TensorFlow.js initialized with backend:', tf.getBackend());
    }
    
    // Check if we have model URLs configured
    const scutUrl = process.env.SCUT_MODEL_SERVER_URL;
    const mebeautyUrl = process.env.MEBEAUTY_MODEL_SERVER_URL;
    
    if (!scutUrl || !mebeautyUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: {
          SCUT_MODEL_SERVER_URL: Boolean(scutUrl),
          MEBEAUTY_MODEL_SERVER_URL: Boolean(mebeautyUrl)
        }
      }, { status: 500 });
    }
    
    // Try to load the models
    console.log('Attempting to load models from URLs');
    
    try {
      // Test connecting to the model URLs
      // We won't actually load the full models, just verify we can access the URLs
      const [scutResponse, mebeautyResponse] = await Promise.all([
        fetch(scutUrl, { method: 'HEAD' }),
        fetch(mebeautyUrl, { method: 'HEAD' })
      ]);
      
      return NextResponse.json({
        success: true,
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
        models: {
          scut: {
            url: scutUrl,
            accessible: scutResponse.ok,
            status: scutResponse.status
          },
          mebeauty: {
            url: mebeautyUrl,
            accessible: mebeautyResponse.ok,
            status: mebeautyResponse.status
          }
        }
      });
    } catch (error) {
      console.error('Error accessing model URLs:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to access model URLs',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Verification test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Verification test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 