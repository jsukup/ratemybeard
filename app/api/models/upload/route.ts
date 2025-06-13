import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // This requires server configuration with appropriate VERCEL_BLOB_* environment variables
    // Only authenticated requests should be allowed
    const authHeader = request.headers.get('authorization');
    if (!process.env.UPLOAD_API_KEY || authHeader !== `Bearer ${process.env.UPLOAD_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { modelPath } = await request.json();
    
    if (!modelPath) {
      return NextResponse.json({ error: 'Model path is required' }, { status: 400 });
    }

    // Get the model file name from the path
    const modelFileName = path.basename(modelPath);
    
    // Check if the file exists
    const fullPath = path.join(process.cwd(), modelPath);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Model file not found' }, { status: 404 });
    }

    // Read the file content
    const fileBuffer = fs.readFileSync(fullPath);
    
    // Options for blob storage
    const blobOptions = {
      access: 'public' as const,
      contentType: 'application/octet-stream',
    };
    
    // Add token explicitly for local development
    if (!process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN) {
      console.log('Running in local environment, using explicit token');
      (blobOptions as any).token = process.env.BLOB_READ_WRITE_TOKEN;
    }
    
    // Upload to Vercel Blob storage with a folder structure
    const blob = await put(`ml-models/${modelFileName}`, new Blob([fileBuffer]), blobOptions);

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
} 