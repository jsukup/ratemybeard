const fs = require('fs');
const path = require('path');

// Paths to the training scripts
const scripts = [
  'api/models/convert_scut_model_to_tflite.sh',
  'api/models/convert_mebeauty_model_to_tflite.sh'
];

// The upload command to append
const uploadCommand = `
# Upload model to Vercel Blob storage
echo "Uploading model to Vercel Blob storage..."
cd ../../ && node scripts/upload-models-to-blob.js
echo "Upload completed."
`;

function updateScript(scriptPath) {
  try {
    console.log(`Updating ${scriptPath}...`);
    
    // Read the script content
    const content = fs.readFileSync(scriptPath, 'utf8');
    
    // Check if the script already has the upload command
    if (content.includes('Uploading model to Vercel Blob storage')) {
      console.log(`Script ${scriptPath} already updated.`);
      return false;
    }
    
    // Append the upload command
    const updatedContent = content + uploadCommand;
    
    // Write the updated content
    fs.writeFileSync(scriptPath, updatedContent);
    
    console.log(`✅ Script ${scriptPath} updated successfully.`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${scriptPath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('Updating training scripts to automatically upload models to Vercel Blob...');
  
  let updatedCount = 0;
  
  for (const scriptPath of scripts) {
    if (updateScript(scriptPath)) {
      updatedCount++;
    }
  }
  
  console.log(`Update process completed. ${updatedCount}/${scripts.length} scripts updated.`);
}

main(); 