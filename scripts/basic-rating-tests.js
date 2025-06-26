// Basic Rating Submission Tests
// Tests core rating functionality with session bypass

const { createClient } = require('@supabase/supabase-js');
const { 
  generateTestSession, 
  submitTestRating, 
  cleanupTestSessions 
} = require('./session-bypass-utility');
const { RatingDataGenerator } = require('./test-data-generator');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const generator = new RatingDataGenerator();

/**
 * Basic Rating Tests Class
 */
class BasicRatingTests {
  constructor() {
    this.testResults = [];
    this.testId = `basic_test_${Date.now()}`;
  }

  /**
   * Log test result
   */
  logResult(testName, success, details = {}) {
    const result = {
      testName,
      success,
      timestamp: new Date().toISOString(),
      details
    };
    this.testResults.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${success ? 'PASSED' : 'FAILED'}`);
    if (!success && details.error) {
      console.log(`   Error: ${details.error}`);
    }
    if (details.message) {
      console.log(`   ${details.message}`);
    }
  }

  /**
   * Test 1: Single rating submission
   */
  async testSingleRatingSubmission() {
    try {
      // Get a test image
      const { data: images, error } = await supabase
        .from('images')
        .select('id, username')
        .limit(1);

      if (error || !images || images.length === 0) {
        this.logResult('Single Rating Submission', false, { 
          error: 'No test images available' 
        });
        return;
      }

      const testImage = images[0];
      const sessionId = generateTestSession(this.testId, 1);
      const rating = 7.5;

      // Submit rating
      const result = await submitTestRating(testImage.id, rating, sessionId);

      if (result.success) {
        // Verify in database
        const { data: savedRating } = await supabase
          .from('ratings')
          .select('*')
          .eq('image_id', testImage.id)
          .eq('session_id', sessionId)
          .single();

        if (savedRating && savedRating.rating === rating) {
          this.logResult('Single Rating Submission', true, {
            message: `Rating ${rating} saved for image ${testImage.username}`,
            imageId: testImage.id,
            sessionId: sessionId
          });
        } else {
          this.logResult('Single Rating Submission', false, {
            error: 'Rating not found in database or incorrect value'
          });
        }
      } else {
        this.logResult('Single Rating Submission', false, {
          error: result.error || `API returned status ${result.status}`
        });
      }

    } catch (error) {
      this.logResult('Single Rating Submission', false, { error: error.message });
    }
  }

  /**
   * Test 2: Multiple ratings for same image (session bypass)
   */
  async testMultipleRatingsSessionBypass() {
    try {
      const { data: images, error } = await supabase
        .from('images')
        .select('id, username')
        .limit(1);

      if (error || !images || images.length === 0) {
        this.logResult('Multiple Ratings Session Bypass', false, { 
          error: 'No test images available' 
        });
        return;
      }

      const testImage = images[0];
      const ratings = [3.5, 7.2, 8.9, 5.1, 9.0];
      const submissions = [];

      // Submit multiple ratings with different sessions
      for (let i = 0; i < ratings.length; i++) {
        const sessionId = generateTestSession(this.testId, i + 10);
        const result = await submitTestRating(testImage.id, ratings[i], sessionId);
        submissions.push({ rating: ratings[i], sessionId, result });
      }

      // Check how many were successful
      const successfulSubmissions = submissions.filter(s => s.result.success);
      
      if (successfulSubmissions.length === ratings.length) {
        // Verify all are in database
        const { data: savedRatings } = await supabase
          .from('ratings')
          .select('rating, session_id')
          .eq('image_id', testImage.id)
          .in('session_id', submissions.map(s => s.sessionId));

        this.logResult('Multiple Ratings Session Bypass', true, {
          message: `${successfulSubmissions.length}/${ratings.length} ratings submitted successfully`,
          savedInDb: savedRatings?.length || 0,
          testRatings: ratings
        });
      } else {
        this.logResult('Multiple Ratings Session Bypass', false, {
          error: `Only ${successfulSubmissions.length}/${ratings.length} submissions succeeded`,
          failures: submissions.filter(s => !s.result.success).map(s => s.result.error)
        });
      }

    } catch (error) {
      this.logResult('Multiple Ratings Session Bypass', false, { error: error.message });
    }
  }

  /**
   * Test 3: Rating validation (boundary testing)
   */
  async testRatingValidation() {
    try {
      const { data: images, error } = await supabase
        .from('images')
        .select('id')
        .limit(1);

      if (error || !images || images.length === 0) {
        this.logResult('Rating Validation', false, { 
          error: 'No test images available' 
        });
        return;
      }

      const testImage = images[0];
      const testCases = [
        { rating: 0.00, shouldSucceed: true, description: 'Minimum valid rating' },
        { rating: 10.00, shouldSucceed: true, description: 'Maximum valid rating' },
        { rating: 5.55, shouldSucceed: true, description: 'Decimal precision' },
        { rating: -1.0, shouldSucceed: false, description: 'Below minimum' },
        { rating: 11.0, shouldSucceed: false, description: 'Above maximum' },
        { rating: 'invalid', shouldSucceed: false, description: 'Non-numeric' }
      ];

      let passedTests = 0;
      const testDetails = [];

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const sessionId = generateTestSession(this.testId, i + 20);
        
        const result = await submitTestRating(testImage.id, testCase.rating, sessionId);
        const actualSucceeded = result.success;
        const expectedSuccess = testCase.shouldSucceed;
        
        const testPassed = actualSucceeded === expectedSuccess;
        if (testPassed) passedTests++;

        testDetails.push({
          rating: testCase.rating,
          expected: expectedSuccess,
          actual: actualSucceeded,
          passed: testPassed,
          description: testCase.description
        });
      }

      this.logResult('Rating Validation', passedTests === testCases.length, {
        message: `${passedTests}/${testCases.length} validation tests passed`,
        testDetails: testDetails
      });

    } catch (error) {
      this.logResult('Rating Validation', false, { error: error.message });
    }
  }

  /**
   * Test 4: Database integrity check
   */
  async testDatabaseIntegrity() {
    try {
      // Get ratings submitted in this test session
      const { data: testRatings, error } = await supabase
        .from('ratings')
        .select('*')
        .like('session_id', `test_${this.testId}_%`);

      if (error) {
        this.logResult('Database Integrity', false, { error: error.message });
        return;
      }

      const integrityChecks = [];
      let allChecksPass = true;

      // Check 1: All ratings have valid image references
      for (const rating of testRatings || []) {
        const { data: imageExists } = await supabase
          .from('images')
          .select('id')
          .eq('id', rating.image_id)
          .single();

        if (!imageExists) {
          allChecksPass = false;
          integrityChecks.push(`Rating ${rating.id} references non-existent image ${rating.image_id}`);
        }
      }

      // Check 2: All ratings within valid range
      for (const rating of testRatings || []) {
        if (rating.rating < 0 || rating.rating > 10) {
          allChecksPass = false;
          integrityChecks.push(`Rating ${rating.id} has invalid value: ${rating.rating}`);
        }
      }

      // Check 3: All ratings have proper session format
      for (const rating of testRatings || []) {
        if (!rating.session_id.startsWith('test_')) {
          allChecksPass = false;
          integrityChecks.push(`Rating ${rating.id} has invalid session format: ${rating.session_id}`);
        }
      }

      this.logResult('Database Integrity', allChecksPass, {
        message: allChecksPass ? 'All integrity checks passed' : 'Some integrity checks failed',
        ratingsChecked: testRatings?.length || 0,
        issues: integrityChecks
      });

    } catch (error) {
      this.logResult('Database Integrity', false, { error: error.message });
    }
  }

  /**
   * Test 5: Duplicate prevention verification
   */
  async testDuplicatePrevention() {
    try {
      const { data: images, error } = await supabase
        .from('images')
        .select('id')
        .limit(1);

      if (error || !images || images.length === 0) {
        this.logResult('Duplicate Prevention', false, { 
          error: 'No test images available' 
        });
        return;
      }

      const testImage = images[0];
      const sessionId = generateTestSession(this.testId, 50);
      const rating = 6.5;

      // First submission should succeed
      const result1 = await submitTestRating(testImage.id, rating, sessionId);
      
      // Second submission with same session should fail
      const result2 = await submitTestRating(testImage.id, rating + 1, sessionId);

      const firstSucceeded = result1.success;
      const secondFailed = !result2.success && result2.status === 409;

      this.logResult('Duplicate Prevention', firstSucceeded && secondFailed, {
        message: firstSucceeded && secondFailed 
          ? 'Duplicate prevention working correctly'
          : 'Duplicate prevention not working as expected',
        firstSubmission: { success: result1.success, status: result1.status },
        secondSubmission: { success: result2.success, status: result2.status }
      });

    } catch (error) {
      this.logResult('Duplicate Prevention', false, { error: error.message });
    }
  }

  /**
   * Run all basic tests
   */
  async runAllTests() {
    console.log('🧪 Starting Basic Rating Tests...\n');
    console.log(`Test ID: ${this.testId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await this.testSingleRatingSubmission();
    await this.testMultipleRatingsSessionBypass();
    await this.testRatingValidation();
    await this.testDatabaseIntegrity();
    await this.testDuplicatePrevention();

    // Summary
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test Summary:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.testName}: ${r.details.error}`));
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: (passedTests / totalTests) * 100,
      results: this.testResults
    };
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    const cleanupResult = await cleanupTestSessions(supabase, this.testId);
    
    if (cleanupResult.success) {
      console.log(`✅ Cleaned up ${cleanupResult.deleted} test ratings`);
    } else {
      console.log(`❌ Cleanup failed: ${cleanupResult.error}`);
    }
    
    return cleanupResult;
  }
}

// Export for use in other test files
module.exports = { BasicRatingTests };

// Run tests if called directly
if (require.main === module) {
  async function runTests() {
    const tests = new BasicRatingTests();
    
    try {
      const results = await tests.runAllTests();
      await tests.cleanup();
      
      // Exit with appropriate code
      process.exit(results.failedTests === 0 ? 0 : 1);
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      await tests.cleanup();
      process.exit(1);
    }
  }

  runTests();
}