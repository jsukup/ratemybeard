// Simple script to test the /api/ensemble endpoint
// Run with: node scripts/test-ensemble-api.js

const fs = require('fs');
const path = require('path');
// Will use dynamic import for node-fetch

// Load a test image file (you might need to adjust the path)
const testImage = path.join(__dirname, '..', 'public', 'sample-face.jpg'); 

// Function to convert a file to base64
function fileToBase64(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      console.log('Please provide a valid image file path.');
      return null;
    }
    
    // Read file as buffer
    const buffer = fs.readFileSync(filePath);
    
    // Convert to base64
    const base64 = buffer.toString('base64');
    
    // Create data URL format
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error converting file to base64:', error);
    return null;
  }
}

// Main test function
async function testEnsembleAPI() {
  console.log('=== Testing /api/ensemble API ===');
  
  // Dynamically import node-fetch
  const { default: fetch } = await import('node-fetch');
  
  // Check if we have a test image
  if (!fs.existsSync(testImage)) {
    console.error(`Test image not found at ${testImage}`);
    console.log('Please place a sample image at public/sample-face.jpg or update the path in this script.');
    return;
  }
  
  // Convert image to base64
  console.log('Converting test image to base64...');
  const imageData = fileToBase64(testImage);
  
  if (!imageData) {
    console.error('Failed to convert image to base64');
    return;
  }
  
  // Determine API URL based on environment
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api/ensemble';
  
  // Make API request
  console.log(`Sending request to: ${apiUrl}`);
  console.log('Image data length:', imageData.length);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_data: imageData
      }),
    });
    
    // Check response status
    console.log('Response status:', response.status);
    
    // Parse response
    const result = await response.json();
    
    // Output results
    console.log('API Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Test passed! API returned a successful response');
    } else {
      console.log('❌ Test failed: API returned error or invalid response');
    }
  } catch (error) {
    console.error('Error calling API:', error);
    console.log('❌ Test failed due to error');
  }
}

// Run the test
testEnsembleAPI(); 