// Direct upload to Vercel Blob
const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');
require('dotenv').config({ path: '.env.local' });

// Options for Vercel Blob operations
const blobOptions = {
  access: 'public',
  contentType: 'application/octet-stream',
};

// Add token only for local development
// When deployed to Vercel, this is automatically detected
if (!process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN) {
  console.log('Running in local environment, using explicit token');
  blobOptions.token = process.env.BLOB_READ_WRITE_TOKEN;
}

// Define the TensorFlow.js model directories
const modelDirs = [
  {
    name: 'SCUT',
    path: 'api/models/tfjs_scut',
  },
  {
    name: 'MEBEAUTY',
    path: 'api/models/tfjs_mebeauty',
  }
];

async function uploadTFJSModel(modelDir) {
  try {
    console.log(`Uploading model from ${modelDir.path}...`);
    
    // Check if directory exists
    if (!fs.existsSync(modelDir.path)) {
      console.error(`Directory not found: ${modelDir.path}`);
      return null;
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(modelDir.path);
    console.log(`Found ${files.length} files in ${modelDir.path}`);
    
    const uploadResults = new Map();
    const folderName = path.basename(modelDir.path);
    
    // First, upload all weight files (.bin)
    for (const file of files) {
      if (file === 'model.json') continue; // Skip model.json for now
      
      const filePath = path.join(modelDir.path, file);
      const fileStats = fs.statSync(filePath);
      
      if (fileStats.isFile()) {
        const fileSize = (fileStats.size / 1024 / 1024).toFixed(2);
        console.log(`Uploading ${file} (${fileSize} MB)...`);
        
        // Read file content
        const fileContent = fs.readFileSync(filePath);
        
        // Upload to Vercel Blob with appropriate structure
        const blobPath = `ml-models/${folderName}/${file}`;
        console.log(`Uploading to Vercel Blob as ${blobPath}...`);
        
        const blob = await put(blobPath, fileContent, {
          ...blobOptions,
          contentType: 'application/octet-stream'
        });
        
        console.log(`✅ Weight file uploaded successfully to ${blob.url}`);
        uploadResults.set(file, blob.url);
      }
    }
    
    // Now handle model.json
    const modelJsonPath = path.join(modelDir.path, 'model.json');
    if (fs.existsSync(modelJsonPath)) {
      // Read and parse model.json
      const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
      
      // Update the weights manifest with the new URLs
      if (modelJson.weightsManifest) {
        modelJson.weightsManifest = modelJson.weightsManifest.map(manifest => {
          manifest.paths = manifest.paths.map(oldPath => {
            // Find the uploaded URL for this weight file
            const fileName = path.basename(oldPath);
            const newUrl = uploadResults.get(fileName);
            if (!newUrl) {
              throw new Error(`Could not find uploaded URL for weight file: ${fileName}`);
            }
            // Extract just the filename with hash from the full URL
            const hashedFileName = path.basename(new URL(newUrl).pathname);
            return hashedFileName;
          });
          return manifest;
        });
      }
      
      // Write updated model.json to a temporary file
      const tempModelJson = path.join(process.cwd(), 'temp-model.json');
      fs.writeFileSync(tempModelJson, JSON.stringify(modelJson));
      
      // Upload the modified model.json
      const blobPath = `ml-models/${folderName}/model.json`;
      const blob = await put(blobPath, fs.readFileSync(tempModelJson), {
        ...blobOptions,
        contentType: 'application/json'
      });
      
      // Clean up temporary file
      fs.unlinkSync(tempModelJson);
      
      console.log(`✅ Model JSON uploaded successfully to ${blob.url}`);
      return blob.url;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error uploading model from ${modelDir.path}:`, error);
    return null;
  }
}

async function main() {
  console.log('Starting TFJS model uploads to Vercel Blob...');
  
  const results = {};
  
  // Upload models sequentially
  for (const modelDir of modelDirs) {
    const modelUrl = await uploadTFJSModel(modelDir);
    if (modelUrl) {
      results[modelDir.name] = modelUrl;
    }
  }
  
  console.log('\nUpload process completed.');
  
  if (Object.keys(results).length > 0) {
    console.log('\nModel URLs for .env.local:');
    for (const [name, url] of Object.entries(results)) {
      console.log(`NEXT_PUBLIC_${name}_MODEL_URL=${url}`);
    }
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 