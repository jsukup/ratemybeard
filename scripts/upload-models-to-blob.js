const fs = require('fs');
const path = require('path');
// Use undici instead of node-fetch (CommonJS compatible)
const { fetch } = require('undici');
// Load .env.local file
require('dotenv').config({ path: '.env.local' });

// Configuration
const UPLOAD_API_KEY = process.env.UPLOAD_API_KEY || 'your-api-key-here';
// Use localhost since we're running the dev server
const API_URL = 'http://localhost:3000/api/models/upload';

console.log('API URL:', API_URL);
console.log('UPLOAD_API_KEY set:', !!process.env.UPLOAD_API_KEY);

// Models to upload
const models = [
  'api/models/beauty_model_scut_resnet50.tflite',
  'api/models/beauty_model_mebeauty_resnet50.tflite'
];

async function uploadModel(modelPath) {
  try {
    console.log(`Uploading ${modelPath}...`);
    
    // Verify file existence
    if (!fs.existsSync(modelPath)) {
      console.error(`File not found: ${modelPath}`);
      return null;
    }
    
    console.log(`File exists: ${modelPath} (${(fs.statSync(modelPath).size / 1024 / 1024).toFixed(2)} MB)`);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${UPLOAD_API_KEY}`
        },
        body: JSON.stringify({ modelPath })
      });
      
      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Response body:', result);
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${result.error || response.statusText}`);
      }
      
      console.log(`✅ Model uploaded successfully: ${result.url}`);
      return result;
    } catch (error) {
      console.error(`❌ Network error:`, error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error uploading ${modelPath}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Starting model uploads to Vercel Blob...');
  
  // Upload models sequentially to avoid memory issues
  for (const modelPath of models) {
    await uploadModel(modelPath);
  }
  
  console.log('Upload process completed.');
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 