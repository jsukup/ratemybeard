import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

// Set duration to maximum allowed for hobby plan
export const maxDuration = 60; // 60 seconds max for hobby plan

// List of models to be uploaded
const MODELS = [
  {
    path: 'api/models/beauty_model_scut_resnet50.tflite',
    name: 'SCUT'
  },
  {
    path: 'api/models/beauty_model_mebeauty_resnet50.tflite',
    name: 'MEBEAUTY'
  }
];

export async function GET(request: NextRequest) {
  try {
    // Only allow this route to be run on Vercel production environment
    if (!process.env.VERCEL_ENV || process.env.VERCEL_ENV !== 'production') {
      return NextResponse.json({ error: 'This route can only be accessed on Vercel production' }, { status: 403 });
    }

    // Check for authorization (basic security)
    const authHeader = request.headers.get('authorization');
    if (!process.env.UPLOAD_API_KEY || authHeader !== `Bearer ${process.env.UPLOAD_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Results object to store upload results
    const results: Record<string, string> = {};
    const errors: Record<string, string> = {};

    // Process each model sequentially
    for (const model of MODELS) {
      try {
        // Get the full path to the model file
        const fullPath = path.join(process.cwd(), model.path);
        
        // Check if the file exists
        if (!fs.existsSync(fullPath)) {
          errors[model.name] = `File not found: ${model.path}`;
          continue;
        }
        
        // Read the file content
        const fileBuffer = fs.readFileSync(fullPath);
        const fileName = path.basename(model.path);
        
        // Upload to Vercel Blob
        const blob = await put(`ml-models/${fileName}`, new Blob([fileBuffer]), {
          access: 'public',
          contentType: 'application/octet-stream',
        });
        
        // Store the result
        results[model.name] = blob.url;
      } catch (error: any) {
        errors[model.name] = error.message || 'Unknown error';
      }
    }

    // Return the results
    return NextResponse.json({
      success: Object.keys(results).length > 0,
      uploaded: results,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error uploading models:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload models' }, { status: 500 });
  }
} 