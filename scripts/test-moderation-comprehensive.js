/**
 * Comprehensive Content Moderation System Test Script
 * 
 * Tests all functionality including edge cases, error conditions,
 * daily digest notifications, and permanent deletion functionality.
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ratemybeard2025';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Test utilities
function generateTestSessionId() {
  return `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateTestImageId() {
  return `test-image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test 1: Basic Report Submission
 */
async function testBasicReportSubmission() {
  console.log('🔍 Test 1: Basic Report Submission...');
  
  const testCases = [
    {
      name: 'Valid report - not_beard',
      data: {
        imageId: generateTestImageId(),
        reportReason: 'not_beard',
        reportDetails: 'This is clearly not a beard image'
      },
      expectedStatus: 201
    },
    {
      name: 'Valid report - inappropriate',
      data: {
        imageId: generateTestImageId(),
        reportReason: 'inappropriate',
        reportDetails: 'Inappropriate content detected'
      },
      expectedStatus: 201
    },
    {
      name: 'Valid report - spam_fake',
      data: {
        imageId: generateTestImageId(),
        reportReason: 'spam_fake',
        reportDetails: 'Obvious spam submission'
      },
      expectedStatus: 201
    },
    {
      name: 'Valid report - other with details',
      data: {
        imageId: generateTestImageId(),
        reportReason: 'other',
        reportDetails: 'Some other issue that needs attention'
      },
      expectedStatus: 201
    }
  ];

  const results = [];
  for (const testCase of testCases) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': generateTestSessionId()
        },
        body: JSON.stringify(testCase.data)
      });

      const result = await response.json();
      const passed = response.status === testCase.expectedStatus;
      
      console.log(`  ${passed ? '✅' : '❌'} ${testCase.name}: ${response.status} ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) {
        console.log(`    Expected: ${testCase.expectedStatus}, Got: ${response.status}`);
        console.log(`    Response:`, result);
      }
      
      results.push({ ...testCase, passed, status: response.status, result });
    } catch (error) {
      console.log(`  ❌ ${testCase.name}: ERROR - ${error.message}`);
      results.push({ ...testCase, passed: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Test 2: Report Validation Edge Cases
 */
async function testReportValidation() {
  console.log('🔍 Test 2: Report Validation Edge Cases...');
  
  const testCases = [
    {
      name: 'Missing imageId',
      data: {
        reportReason: 'inappropriate',
        reportDetails: 'Test'
      },
      expectedStatus: 400
    },
    {
      name: 'Invalid report reason',
      data: {
        imageId: generateTestImageId(),
        reportReason: 'invalid_reason',
        reportDetails: 'Test'
      },
      expectedStatus: 400
    },
    {
      name: 'Missing details for "other" reason',
      data: {
        imageId: generateTestImageId(),
        reportReason: 'other'
      },
      expectedStatus: 400
    },
    {
      name: 'Details too long (>500 chars)',
      data: {
        imageId: generateTestImageId(),
        reportReason: 'inappropriate',
        reportDetails: 'x'.repeat(501)
      },
      expectedStatus: 400
    },
    {
      name: 'Empty session ID',
      data: {
        imageId: generateTestImageId(),
        reportReason: 'inappropriate',
        reportDetails: 'Test'
      },
      headers: { 'x-session-id': '' },
      expectedStatus: 400
    }
  ];

  const results = [];
  for (const testCase of testCases) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-session-id': testCase.headers?.['x-session-id'] ?? generateTestSessionId()
      };

      const response = await fetch(`${API_BASE_URL}/api/reports/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify(testCase.data)
      });

      const result = await response.json();
      const passed = response.status === testCase.expectedStatus;
      
      console.log(`  ${passed ? '✅' : '❌'} ${testCase.name}: ${response.status} ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) {
        console.log(`    Expected: ${testCase.expectedStatus}, Got: ${response.status}`);
        console.log(`    Response:`, result);
      }
      
      results.push({ ...testCase, passed, status: response.status, result });
    } catch (error) {
      console.log(`  ❌ ${testCase.name}: ERROR - ${error.message}`);
      results.push({ ...testCase, passed: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Test 3: Duplicate Prevention
 */
async function testDuplicatePrevention() {
  console.log('🔍 Test 3: Duplicate Report Prevention...');
  
  const sessionId = generateTestSessionId();
  const imageId = generateTestImageId();
  const reportData = {
    imageId: imageId,
    reportReason: 'inappropriate',
    reportDetails: 'Duplicate test report'
  };

  const results = [];
  
  // First report should succeed
  try {
    const response1 = await fetch(`${API_BASE_URL}/api/reports/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify(reportData)
    });

    const result1 = await response1.json();
    const passed1 = response1.status === 201;
    
    console.log(`  ${passed1 ? '✅' : '❌'} First report: ${response1.status} ${passed1 ? 'PASS' : 'FAIL'}`);
    results.push({ name: 'First report', passed: passed1, status: response1.status, result: result1 });

    // Second report should fail with 409
    const response2 = await fetch(`${API_BASE_URL}/api/reports/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify(reportData)
    });

    const result2 = await response2.json();
    const passed2 = response2.status === 409;
    
    console.log(`  ${passed2 ? '✅' : '❌'} Duplicate report: ${response2.status} ${passed2 ? 'PASS' : 'FAIL'}`);
    results.push({ name: 'Duplicate report', passed: passed2, status: response2.status, result: result2 });

  } catch (error) {
    console.log(`  ❌ Duplicate prevention test: ERROR - ${error.message}`);
    results.push({ name: 'Duplicate prevention', passed: false, error: error.message });
  }
  
  return results;
}

/**
 * Test 4: Rate Limiting
 */
async function testRateLimiting() {
  console.log('🔍 Test 4: Rate Limiting (10 reports per day per IP)...');
  
  const results = [];
  const sessionBase = generateTestSessionId();
  
  try {
    const promises = [];
    
    // Submit exactly 10 reports (should all succeed)
    for (let i = 0; i < 10; i++) {
      promises.push(
        fetch(`${API_BASE_URL}/api/reports/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': `${sessionBase}-${i}`
          },
          body: JSON.stringify({
            imageId: generateTestImageId(),
            reportReason: 'spam_fake',
            reportDetails: `Rate limit test report ${i + 1}`
          })
        })
      );
    }

    const responses = await Promise.all(promises);
    const resolvedResults = await Promise.all(responses.map(r => r.json()));
    
    let successCount = 0;
    responses.forEach((response, index) => {
      if (response.status === 201) {
        successCount++;
      }
    });
    
    console.log(`  📊 Reports 1-10: ${successCount}/10 succeeded`);
    
    // 11th report should be rate limited
    await sleep(100); // Small delay
    const response11 = await fetch(`${API_BASE_URL}/api/reports/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': `${sessionBase}-11`
      },
      body: JSON.stringify({
        imageId: generateTestImageId(),
        reportReason: 'spam_fake',
        reportDetails: 'Rate limit test report 11 (should fail)'
      })
    });

    const result11 = await response11.json();
    const rateLimited = response11.status === 429;
    
    console.log(`  ${rateLimited ? '✅' : '❌'} 11th report rate limited: ${response11.status} ${rateLimited ? 'PASS' : 'FAIL'}`);
    
    results.push({
      name: 'Rate limiting',
      passed: successCount === 10 && rateLimited,
      successCount,
      rateLimited,
      status11: response11.status
    });

  } catch (error) {
    console.log(`  ❌ Rate limiting test: ERROR - ${error.message}`);
    results.push({ name: 'Rate limiting', passed: false, error: error.message });
  }
  
  return results;
}

/**
 * Test 5: Admin Authentication
 */
async function testAdminAuthentication() {
  console.log('🔍 Test 5: Admin Authentication...');
  
  const testCases = [
    {
      name: 'Valid admin password',
      password: ADMIN_PASSWORD,
      expectedStatus: 200
    },
    {
      name: 'Invalid admin password',
      password: 'wrong-password',
      expectedStatus: 401
    },
    {
      name: 'Missing admin password',
      password: null,
      expectedStatus: 401
    }
  ];

  const results = [];
  for (const testCase of testCases) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (testCase.password) {
        headers['x-admin-password'] = testCase.password;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/reports`, {
        method: 'GET',
        headers
      });

      const result = await response.json();
      const passed = response.status === testCase.expectedStatus;
      
      console.log(`  ${passed ? '✅' : '❌'} ${testCase.name}: ${response.status} ${passed ? 'PASS' : 'FAIL'}`);
      
      results.push({ ...testCase, passed, status: response.status, result });
    } catch (error) {
      console.log(`  ❌ ${testCase.name}: ERROR - ${error.message}`);
      results.push({ ...testCase, passed: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Test 6: Daily Digest Functionality
 */
async function testDailyDigest() {
  console.log('🔍 Test 6: Daily Digest Functionality...');
  
  const results = [];
  
  try {
    // Test GET digest
    const response = await fetch(`${API_BASE_URL}/api/admin/daily-digest`, {
      method: 'GET',
      headers: {
        'x-admin-password': ADMIN_PASSWORD
      }
    });

    const result = await response.json();
    const passed = response.status === 200 && result.success;
    
    console.log(`  ${passed ? '✅' : '❌'} Get daily digest: ${response.status} ${passed ? 'PASS' : 'FAIL'}`);
    if (passed) {
      console.log(`    📊 Digest stats: ${result.stats.flaggedImages} flagged, ${result.stats.newReportsToday} new reports today`);
    }
    
    results.push({ name: 'Get daily digest', passed, status: response.status, result });

    // Test POST digest (send notification)
    if (passed) {
      const postResponse = await fetch(`${API_BASE_URL}/api/admin/daily-digest`, {
        method: 'POST',
        headers: {
          'x-admin-password': ADMIN_PASSWORD
        }
      });

      const postResult = await postResponse.json();
      const postPassed = postResponse.status === 200 && postResult.success;
      
      console.log(`  ${postPassed ? '✅' : '❌'} Send digest notification: ${postResponse.status} ${postPassed ? 'PASS' : 'FAIL'}`);
      if (postPassed) {
        console.log(`    📬 Notification sent: ${postResult.sent ? 'Yes' : 'No'} (${postResult.message})`);
      }
      
      results.push({ name: 'Send digest notification', passed: postPassed, status: postResponse.status, result: postResult });
    }

  } catch (error) {
    console.log(`  ❌ Daily digest test: ERROR - ${error.message}`);
    results.push({ name: 'Daily digest', passed: false, error: error.message });
  }
  
  return results;
}

/**
 * Test 7: Permanent Deletion Functionality
 */
async function testPermanentDeletion() {
  console.log('🔍 Test 7: Permanent Deletion Functionality...');
  
  const results = [];
  
  try {
    // Test validation - missing confirmDelete
    const response1 = await fetch(`${API_BASE_URL}/api/admin/delete-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': ADMIN_PASSWORD
      },
      body: JSON.stringify({
        imageId: generateTestImageId(),
        moderatorId: 'test-admin'
        // Missing confirmDelete: true
      })
    });

    const result1 = await response1.json();
    const passed1 = response1.status === 400 && result1.error.includes('confirmDelete');
    
    console.log(`  ${passed1 ? '✅' : '❌'} Validation - missing confirmDelete: ${response1.status} ${passed1 ? 'PASS' : 'FAIL'}`);
    results.push({ name: 'Validation missing confirmDelete', passed: passed1, status: response1.status, result: result1 });

    // Test validation - missing fields
    const response2 = await fetch(`${API_BASE_URL}/api/admin/delete-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': ADMIN_PASSWORD
      },
      body: JSON.stringify({
        confirmDelete: true
        // Missing imageId and moderatorId
      })
    });

    const result2 = await response2.json();
    const passed2 = response2.status === 400 && result2.error.includes('Missing required fields');
    
    console.log(`  ${passed2 ? '✅' : '❌'} Validation - missing fields: ${response2.status} ${passed2 ? 'PASS' : 'FAIL'}`);
    results.push({ name: 'Validation missing fields', passed: passed2, status: response2.status, result: result2 });

    // Test deletion of non-existent image
    const response3 = await fetch(`${API_BASE_URL}/api/admin/delete-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': ADMIN_PASSWORD
      },
      body: JSON.stringify({
        imageId: 'non-existent-image-id',
        moderatorId: 'test-admin',
        confirmDelete: true
      })
    });

    const result3 = await response3.json();
    const passed3 = response3.status === 404 || (response3.status === 500 && result3.error.includes('not found'));
    
    console.log(`  ${passed3 ? '✅' : '❌'} Delete non-existent image: ${response3.status} ${passed3 ? 'PASS' : 'FAIL'}`);
    results.push({ name: 'Delete non-existent image', passed: passed3, status: response3.status, result: result3 });

    // Test GET deletion stats
    const response4 = await fetch(`${API_BASE_URL}/api/admin/delete-image?days=7`, {
      method: 'GET',
      headers: {
        'x-admin-password': ADMIN_PASSWORD
      }
    });

    const result4 = await response4.json();
    const passed4 = response4.status === 200 && result4.success && result4.stats;
    
    console.log(`  ${passed4 ? '✅' : '❌'} Get deletion stats: ${response4.status} ${passed4 ? 'PASS' : 'FAIL'}`);
    if (passed4) {
      console.log(`    📊 Deletion stats (7 days): ${result4.stats.total_deletions} total deletions`);
    }
    results.push({ name: 'Get deletion stats', passed: passed4, status: response4.status, result: result4 });

  } catch (error) {
    console.log(`  ❌ Permanent deletion test: ERROR - ${error.message}`);
    results.push({ name: 'Permanent deletion', passed: false, error: error.message });
  }
  
  return results;
}

/**
 * Test 8: Concurrent Request Handling
 */
async function testConcurrentRequests() {
  console.log('🔍 Test 8: Concurrent Request Handling...');
  
  const results = [];
  
  try {
    const sessionId = generateTestSessionId();
    const imageId = generateTestImageId();
    
    // Submit multiple reports for the same image simultaneously
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        fetch(`${API_BASE_URL}/api/reports/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': `${sessionId}-${i}`
          },
          body: JSON.stringify({
            imageId: imageId,
            reportReason: 'inappropriate',
            reportDetails: `Concurrent test report ${i + 1}`
          })
        })
      );
    }

    const responses = await Promise.all(promises);
    const resolvedResults = await Promise.all(responses.map(r => r.json()));
    
    let successCount = 0;
    responses.forEach((response, index) => {
      if (response.status === 201) {
        successCount++;
      }
    });
    
    console.log(`  📊 Concurrent reports: ${successCount}/5 succeeded`);
    const passed = successCount >= 4; // Allow for some variance due to timing
    
    console.log(`  ${passed ? '✅' : '❌'} Concurrent handling: ${passed ? 'PASS' : 'FAIL'}`);
    results.push({ name: 'Concurrent requests', passed, successCount, totalRequests: 5 });

  } catch (error) {
    console.log(`  ❌ Concurrent requests test: ERROR - ${error.message}`);
    results.push({ name: 'Concurrent requests', passed: false, error: error.message });
  }
  
  return results;
}

/**
 * Test 9: Database Function Testing
 */
async function testDatabaseFunctions() {
  console.log('🔍 Test 9: Database Functions...');
  
  const results = [];
  
  try {
    // Test get_flagged_images function
    const response = await fetch(`${API_BASE_URL}/api/admin/reports`, {
      method: 'GET',
      headers: {
        'x-admin-password': ADMIN_PASSWORD
      }
    });

    const result = await response.json();
    const passed = response.status === 200 && result.success;
    
    console.log(`  ${passed ? '✅' : '❌'} get_flagged_images function: ${response.status} ${passed ? 'PASS' : 'FAIL'}`);
    if (passed) {
      console.log(`    📊 Function results: ${result.flaggedImages?.length || 0} flagged images, ${result.totalFlagged} total`);
    }
    
    results.push({ name: 'Database functions', passed, status: response.status, result });

  } catch (error) {
    console.log(`  ❌ Database functions test: ERROR - ${error.message}`);
    results.push({ name: 'Database functions', passed: false, error: error.message });
  }
  
  return results;
}

/**
 * Main comprehensive test runner
 */
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Content Moderation System Tests...\n');
  console.log(`📡 Testing against: ${API_BASE_URL}`);
  console.log(`🔐 Admin password: ${ADMIN_PASSWORD ? '[SET]' : '[NOT SET]'}\n`);
  
  const allResults = {};
  
  try {
    allResults.basicReports = await testBasicReportSubmission();
    console.log('');
    
    allResults.validation = await testReportValidation();
    console.log('');
    
    allResults.duplicates = await testDuplicatePrevention();
    console.log('');
    
    allResults.rateLimit = await testRateLimiting();
    console.log('');
    
    allResults.adminAuth = await testAdminAuthentication();
    console.log('');
    
    allResults.dailyDigest = await testDailyDigest();
    console.log('');
    
    allResults.permanentDeletion = await testPermanentDeletion();
    console.log('');
    
    allResults.concurrent = await testConcurrentRequests();
    console.log('');
    
    allResults.database = await testDatabaseFunctions();
    console.log('');

    // Summary
    console.log('📊 TEST SUMMARY:');
    console.log('================');
    
    let totalTests = 0;
    let passedTests = 0;
    
    Object.entries(allResults).forEach(([category, tests]) => {
      const categoryPassed = tests.filter(t => t.passed).length;
      const categoryTotal = tests.length;
      totalTests += categoryTotal;
      passedTests += categoryPassed;
      
      console.log(`${category}: ${categoryPassed}/${categoryTotal} passed`);
    });
    
    console.log(`\n🎯 OVERALL: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! The moderation system is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the detailed output above for issues.');
    }

  } catch (error) {
    console.error('❌ Test runner error:', error);
  }
  
  console.log('\n🏁 Comprehensive Content Moderation System Tests Complete!');
  
  return allResults;
}

/**
 * Print enhanced usage instructions
 */
function printEnhancedInstructions() {
  console.log('\n📋 Enhanced Setup Instructions:');
  console.log('===============================');
  console.log('1. Apply all database migrations:');
  console.log('   supabase db push --file supabase/migrations/20250626_content_moderation.sql');
  console.log('   supabase db push --file supabase/migrations/20250626_delete_image_function.sql');
  console.log('');
  console.log('2. Set environment variables:');
  console.log('   ADMIN_PASSWORD=your-secure-password');
  console.log('   ADMIN_WEBHOOK_URL=https://your-webhook-endpoint.com (optional)');
  console.log('   ADMIN_EMAIL=admin@yourdomain.com (optional)');
  console.log('');
  console.log('3. Start the development server:');
  console.log('   npm run dev');
  console.log('');
  console.log('4. Run comprehensive tests:');
  console.log('   node scripts/test-moderation-comprehensive.js');
  console.log('');
  console.log('5. Access admin features:');
  console.log('   - Admin dashboard: http://localhost:3000/admin');
  console.log('   - Daily digest: GET /api/admin/daily-digest');
  console.log('   - Send notifications: POST /api/admin/daily-digest');
  console.log('   - Deletion stats: GET /api/admin/delete-image?days=30');
  console.log('');
  console.log('📝 New Features Tested:');
  console.log('- Daily digest generation and notifications');
  console.log('- Permanent image deletion with audit trail');
  console.log('- Enhanced admin authentication');
  console.log('- Comprehensive error handling');
  console.log('- Rate limiting and concurrent request handling');
  console.log('- Database function integrity');
  console.log('');
}

// Run if called directly
if (require.main === module) {
  printEnhancedInstructions();
  
  // Uncomment to run actual tests
  runComprehensiveTests().catch(console.error);
}

module.exports = {
  testBasicReportSubmission,
  testReportValidation,
  testDuplicatePrevention,
  testRateLimiting,
  testAdminAuthentication,
  testDailyDigest,
  testPermanentDeletion,
  testConcurrentRequests,
  testDatabaseFunctions,
  runComprehensiveTests
};