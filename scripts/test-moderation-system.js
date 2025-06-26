/**
 * Content Moderation System Test Script
 * 
 * This script documents how to test the content moderation system
 * and provides examples of API usage.
 */

const ADMIN_PASSWORD = 'ratemyfeet2025'; // Default admin password
const API_BASE_URL = 'http://localhost:3000';

/**
 * Test report submission
 */
async function testReportSubmission() {
  console.log('🔍 Testing Report Submission...');
  
  const reportData = {
    imageId: 'test-image-id',
    reportReason: 'inappropriate',
    reportDetails: 'This is a test report'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/reports/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': 'test-session-123'
      },
      body: JSON.stringify(reportData)
    });

    const result = await response.json();
    console.log('Report submission result:', result);
    
    if (response.ok) {
      console.log('✅ Report submission successful');
      return result;
    } else {
      console.log('❌ Report submission failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return null;
  }
}

/**
 * Test fetching flagged images (admin)
 */
async function testFetchFlaggedImages() {
  console.log('🔍 Testing Admin - Fetch Flagged Images...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/reports`, {
      method: 'GET',
      headers: {
        'x-admin-password': ADMIN_PASSWORD
      }
    });

    const result = await response.json();
    console.log('Flagged images result:', result);
    
    if (response.ok) {
      console.log('✅ Flagged images fetch successful');
      console.log(`Found ${result.flaggedImages?.length || 0} flagged images`);
      console.log('Stats:', result.stats);
      return result;
    } else {
      console.log('❌ Flagged images fetch failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return null;
  }
}

/**
 * Test moderation action (admin)
 */
async function testModerationAction(imageId, action = 'approve') {
  console.log(`🔍 Testing Admin - ${action} image...`);
  
  const actionData = {
    imageId: imageId,
    action: action, // 'approve' or 'hide'
    moderatorId: 'test-admin'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': ADMIN_PASSWORD
      },
      body: JSON.stringify(actionData)
    });

    const result = await response.json();
    console.log('Moderation action result:', result);
    
    if (response.ok) {
      console.log(`✅ Image ${action} successful`);
      return result;
    } else {
      console.log(`❌ Image ${action} failed:`, result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return null;
  }
}

/**
 * Test rate limiting
 */
async function testRateLimit() {
  console.log('🔍 Testing Report Rate Limiting...');
  
  const reportData = {
    imageId: 'test-image-id-2',
    reportReason: 'spam_fake',
    reportDetails: 'Rate limit test'
  };

  // Try to submit multiple reports quickly
  const promises = [];
  for (let i = 0; i < 12; i++) { // More than the daily limit of 10
    promises.push(
      fetch(`${API_BASE_URL}/api/reports/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': `test-session-rate-limit`
        },
        body: JSON.stringify({
          ...reportData,
          imageId: `test-image-${i}` // Different images
        })
      })
    );
  }

  try {
    const responses = await Promise.all(promises);
    const results = await Promise.all(responses.map(r => r.json()));
    
    let successCount = 0;
    let rateLimitedCount = 0;
    
    results.forEach((result, index) => {
      if (responses[index].ok) {
        successCount++;
      } else if (responses[index].status === 429) {
        rateLimitedCount++;
      }
    });
    
    console.log(`✅ Rate limit test results:`);
    console.log(`  - Successful reports: ${successCount}`);
    console.log(`  - Rate limited reports: ${rateLimitedCount}`);
    
    return { successCount, rateLimitedCount };
  } catch (error) {
    console.error('❌ Rate limit test error:', error);
    return null;
  }
}

/**
 * Main test function
 */
async function runModerationTests() {
  console.log('🚀 Starting Content Moderation System Tests...\n');
  
  // Test 1: Report submission
  await testReportSubmission();
  console.log('');
  
  // Test 2: Admin fetch flagged images
  await testFetchFlaggedImages();
  console.log('');
  
  // Test 3: Admin moderation action
  await testModerationAction('test-image-id', 'approve');
  console.log('');
  
  // Test 4: Rate limiting (commented out to avoid spamming)
  // await testRateLimit();
  // console.log('');
  
  console.log('🏁 Content Moderation System Tests Complete!');
  console.log('\n📝 Testing Notes:');
  console.log('- Make sure the development server is running (npm run dev)');
  console.log('- Update ADMIN_PASSWORD if you changed it in environment variables');
  console.log('- Replace test image IDs with real ones from your database');
  console.log('- The database migration must be applied for the system to work');
  console.log('- Test with real session IDs and image data for complete validation');
}

/**
 * Database setup instructions
 */
function printSetupInstructions() {
  console.log('\n📋 Setup Instructions:');
  console.log('1. Run the database migration:');
  console.log('   supabase db push --file supabase/migrations/20250626_content_moderation.sql');
  console.log('');
  console.log('2. Set environment variables (optional):');
  console.log('   ADMIN_PASSWORD=your-secure-password');
  console.log('');
  console.log('3. Start the development server:');
  console.log('   npm run dev');
  console.log('');
  console.log('4. Test the system:');
  console.log('   node scripts/test-moderation-system.js');
  console.log('');
  console.log('5. Access admin dashboard:');
  console.log('   http://localhost:3000/admin');
  console.log('');
}

/**
 * Usage examples
 */
function printUsageExamples() {
  console.log('\n💡 Usage Examples:');
  console.log('');
  console.log('1. User reports an image:');
  console.log('   - Click flag button on leaderboard');
  console.log('   - Select report reason');
  console.log('   - Optionally add details');
  console.log('   - Submit report');
  console.log('');
  console.log('2. Admin reviews reports:');
  console.log('   - Go to /admin');
  console.log('   - Enter admin password');
  console.log('   - Review flagged images');
  console.log('   - Click approve (✓) or hide (👁) buttons');
  console.log('');
  console.log('3. System automatically flags images:');
  console.log('   - Images with 3+ reports are auto-flagged');
  console.log('   - Flagged images remain visible until admin action');
  console.log('   - Hidden images are filtered from leaderboard');
  console.log('');
}

// Run if called directly
if (require.main === module) {
  printSetupInstructions();
  printUsageExamples();
  
  // Uncomment to run actual tests
  // runModerationTests();
}

module.exports = {
  testReportSubmission,
  testFetchFlaggedImages,
  testModerationAction,
  testRateLimit,
  runModerationTests
};