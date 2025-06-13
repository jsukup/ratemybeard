/**
 * Vercel Blob Setup Script
 * 
 * This script:
 * 1. Uploads TFLite models to Vercel Blob
 * 2. Updates training scripts to automatically upload models in the future
 * 3. Updates environment variables with the model URLs
 * 
 * Requirements:
 * - BLOB_READ_WRITE_TOKEN environment variable must be set
 * - UPLOAD_API_KEY environment variable must be set
 * 
 * Run with: node scripts/setup-vercel-blob.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Check required environment variables
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is not set.');
  console.error('Please set it in .env.local or as an environment variable.');
  process.exit(1);
}

if (!process.env.UPLOAD_API_KEY) {
  console.error('❌ UPLOAD_API_KEY environment variable is not set.');
  console.error('Please set it in .env.local or as an environment variable.');
  process.exit(1);
}

// Run a step and handle errors
function runStep(name, fn) {
  console.log(`\n🔄 ${name}...`);
  try {
    fn();
    console.log(`✅ ${name} completed successfully.`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} failed:`, error);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Setting up Vercel Blob for model storage...\n');
  
  // Step 1: Upload models to Vercel Blob
  runStep('Uploading models to Vercel Blob', () => {
    console.log('Running upload-models-to-blob.js...');
    execSync('node scripts/upload-models-to-blob.js', { stdio: 'inherit' });
  });
  
  // Step 2: Update training scripts
  runStep('Updating training scripts', () => {
    console.log('Running update-training-scripts.js...');
    execSync('node scripts/update-training-scripts.js', { stdio: 'inherit' });
  });
  
  // Step 3: Deploy to Vercel (if needed)
  const shouldDeploy = process.argv.includes('--deploy');
  if (shouldDeploy) {
    runStep('Deploying to Vercel', () => {
      console.log('Deploying to Vercel...');
      execSync('vercel deploy --prod', { stdio: 'inherit' });
    });
  }
  
  console.log('\n🎉 Vercel Blob setup completed!');
  console.log('\nNext steps:');
  console.log('1. Update the SCUT_MODEL_URL and MEBEAUTY_MODEL_URL in .env.local with the URLs from the upload');
  console.log('2. Deploy your application to Vercel if you haven\'t already');
  console.log('3. Set the environment variables in the Vercel dashboard');
  
  if (!shouldDeploy) {
    console.log('\nTo deploy now, run: node scripts/setup-vercel-blob.js --deploy');
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 