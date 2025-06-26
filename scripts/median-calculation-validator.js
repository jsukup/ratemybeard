// Median Calculation Accuracy Validator
// Tests mathematical precision of median calculations and database updates

const { createClient } = require('@supabase/supabase-js');
const { 
  generateTestSession, 
  submitTestRating,
  generateMultipleSessions,
  cleanupTestSessions 
} = require('./session-bypass-utility');
const { RatingDataGenerator, validateRatingData } = require('./test-data-generator');

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
 * Median Calculation Validator Class
 */
class MedianCalculationValidator {
  constructor() {
    this.testResults = [];
    this.testId = `median_test_${Date.now()}`;
    this.tolerance = 0.01; // Acceptable difference for floating point comparisons
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
   * Compare two numbers with tolerance for floating point precision
   */
  isNearlyEqual(a, b, tolerance = this.tolerance) {
    return Math.abs(a - b) <= tolerance;
  }

  /**
   * Submit ratings to an image and verify median calculation
   */
  async submitRatingsAndVerifyMedian(imageId, ratings, testName) {
    try {
      const sessions = generateMultipleSessions(this.testId, ratings.length);
      const submissions = [];

      // Submit all ratings
      for (let i = 0; i < ratings.length; i++) {
        const result = await submitTestRating(imageId, ratings[i], sessions[i]);
        submissions.push(result);
        
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Check if all submissions were successful
      const successfulSubmissions = submissions.filter(s => s.success);
      if (successfulSubmissions.length !== ratings.length) {
        this.logResult(testName, false, {
          error: `Only ${successfulSubmissions.length}/${ratings.length} ratings submitted successfully`
        });
        return false;
      }

      // Wait a moment for database updates to process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch updated image statistics
      const { data: updatedImage, error } = await supabase
        .from('images')
        .select('median_score, rating_count')
        .eq('id', imageId)
        .single();

      if (error) {
        this.logResult(testName, false, { error: `Failed to fetch updated image: ${error.message}` });
        return false;
      }

      // Calculate expected median
      const expectedMedian = generator.calculateExpectedMedian(ratings);
      const actualMedian = updatedImage.median_score;
      const expectedCount = ratings.length;
      const actualCount = updatedImage.rating_count;

      // Verify median calculation
      const medianCorrect = this.isNearlyEqual(expectedMedian, actualMedian);
      const countCorrect = actualCount >= expectedCount; // May be higher due to existing ratings

      this.logResult(testName, medianCorrect, {
        message: `Expected: ${expectedMedian}, Actual: ${actualMedian}, Count: ${actualCount}`,
        ratings: ratings,
        expectedMedian: expectedMedian,
        actualMedian: actualMedian,
        medianCorrect: medianCorrect,
        countCorrect: countCorrect,
        submissions: successfulSubmissions.length
      });

      return medianCorrect;

    } catch (error) {
      this.logResult(testName, false, { error: error.message });
      return false;
    }
  }

  /**
   * Test 1: Basic median calculations with known patterns
   */
  async testBasicMedianPatterns() {
    console.log('🔢 Testing Basic Median Patterns...\n');

    const { data: images, error } = await supabase
      .from('images')
      .select('id, username')
      .limit(5);

    if (error || !images || images.length < 5) {
      this.logResult('Basic Median Patterns', false, { 
        error: 'Need at least 5 test images available' 
      });
      return;
    }

    const testCases = [
      {
        name: 'Single Rating',
        ratings: generator.generatePattern('single'),
        imageIndex: 0
      },
      {
        name: 'Even Count Simple',
        ratings: generator.generatePattern('even_simple'),
        imageIndex: 1
      },
      {
        name: 'Odd Count Simple',
        ratings: generator.generatePattern('odd_simple'),
        imageIndex: 2
      },
      {
        name: 'Precision Test',
        ratings: generator.generatePattern('precision_test'),
        imageIndex: 3
      },
      {
        name: 'Extreme Values',
        ratings: generator.generatePattern('extremes'),
        imageIndex: 4
      }
    ];

    let passedTests = 0;
    for (const testCase of testCases) {
      console.log(`\n   Testing: ${testCase.name}`);
      console.log(`   Ratings: [${testCase.ratings.join(', ')}]`);
      console.log(`   Expected median: ${generator.calculateExpectedMedian(testCase.ratings)}`);
      
      const success = await this.submitRatingsAndVerifyMedian(
        images[testCase.imageIndex].id,
        testCase.ratings,
        `Basic Pattern: ${testCase.name}`
      );
      
      if (success) passedTests++;
    }

    const overallSuccess = passedTests === testCases.length;
    console.log(`\n📊 Basic Patterns Summary: ${passedTests}/${testCases.length} tests passed`);
    
    return overallSuccess;
  }

  /**
   * Test 2: Statistical distribution accuracy
   */
  async testStatisticalDistributions() {
    console.log('\n📈 Testing Statistical Distributions...\n');

    const { data: images, error } = await supabase
      .from('images')
      .select('id, username')
      .limit(3);

    if (error || !images || images.length < 3) {
      this.logResult('Statistical Distributions', false, { 
        error: 'Need at least 3 test images available' 
      });
      return;
    }

    const testCases = [
      {
        name: 'Normal Distribution (N=15)',
        ratings: generator.generateNormal(15, 6.0, 1.5),
        imageIndex: 0
      },
      {
        name: 'Uniform Distribution (N=20)',
        ratings: generator.generateUniform(20, 2.0, 8.0),
        imageIndex: 1
      },
      {
        name: 'Targeted Distribution (N=12)',
        ratings: generator.generateTargetedDistribution(12, 7.0, 9.0, 0.5),
        imageIndex: 2
      }
    ];

    let passedTests = 0;
    for (const testCase of testCases) {
      console.log(`\n   Testing: ${testCase.name}`);
      console.log(`   Sample ratings: [${testCase.ratings.slice(0, 5).join(', ')}...]`);
      console.log(`   Expected median: ${generator.calculateExpectedMedian(testCase.ratings)}`);
      
      const success = await this.submitRatingsAndVerifyMedian(
        images[testCase.imageIndex].id,
        testCase.ratings,
        `Distribution: ${testCase.name}`
      );
      
      if (success) passedTests++;
    }

    const overallSuccess = passedTests === testCases.length;
    console.log(`\n📊 Distributions Summary: ${passedTests}/${testCases.length} tests passed`);
    
    return overallSuccess;
  }

  /**
   * Test 3: Edge cases and boundary conditions
   */
  async testEdgeCases() {
    console.log('\n⚠️  Testing Edge Cases...\n');

    const { data: images, error } = await supabase
      .from('images')
      .select('id, username')
      .limit(4);

    if (error || !images || images.length < 4) {
      this.logResult('Edge Cases', false, { 
        error: 'Need at least 4 test images available' 
      });
      return;
    }

    const testCases = [
      {
        name: 'Large Dataset (N=50)',
        ratings: generator.generateNormal(50, 5.0, 2.0),
        imageIndex: 0
      },
      {
        name: 'Polarized Ratings',
        ratings: generator.generatePattern('mixed_polarized', 20),
        imageIndex: 1
      },
      {
        name: 'Category Boundary Test',
        ratings: generator.generatePattern('threshold_test'),
        imageIndex: 2
      },
      {
        name: 'High Precision Values',
        ratings: [1.23, 4.56, 7.89, 2.34, 5.67, 8.90, 3.45, 6.78, 9.01],
        imageIndex: 3
      }
    ];

    let passedTests = 0;
    for (const testCase of testCases) {
      console.log(`\n   Testing: ${testCase.name}`);
      console.log(`   Count: ${testCase.ratings.length} ratings`);
      console.log(`   Expected median: ${generator.calculateExpectedMedian(testCase.ratings)}`);
      
      const success = await this.submitRatingsAndVerifyMedian(
        images[testCase.imageIndex].id,
        testCase.ratings,
        `Edge Case: ${testCase.name}`
      );
      
      if (success) passedTests++;
    }

    const overallSuccess = passedTests === testCases.length;
    console.log(`\n📊 Edge Cases Summary: ${passedTests}/${testCases.length} tests passed`);
    
    return overallSuccess;
  }

  /**
   * Test 4: Progressive median calculation (adding ratings one by one)
   */
  async testProgressiveCalculation() {
    console.log('\n🔄 Testing Progressive Median Calculation...\n');

    const { data: images, error } = await supabase
      .from('images')
      .select('id, username, rating_count')
      .limit(1);

    if (error || !images || images.length < 1) {
      this.logResult('Progressive Calculation', false, { 
        error: 'Need at least 1 test image available' 
      });
      return;
    }

    const testImage = images[0];
    const ratings = [2.5, 7.0, 5.5, 8.5, 4.0, 9.0, 6.5, 3.5, 7.5, 5.0];
    const sessions = generateMultipleSessions(this.testId, ratings.length);
    
    let allCorrect = true;
    const progressResults = [];

    console.log(`   Testing with image: ${testImage.username}`);
    console.log(`   Adding ratings progressively: [${ratings.join(', ')}]`);

    for (let i = 0; i < ratings.length; i++) {
      // Submit one rating
      const result = await submitTestRating(testImage.id, ratings[i], sessions[i]);
      
      if (!result.success) {
        this.logResult('Progressive Calculation', false, {
          error: `Failed to submit rating ${i + 1}: ${result.error}`
        });
        return false;
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Check current median
      const { data: currentImage } = await supabase
        .from('images')
        .select('median_score, rating_count')
        .eq('id', testImage.id)
        .single();

      const currentRatings = ratings.slice(0, i + 1);
      const expectedMedian = generator.calculateExpectedMedian(currentRatings);
      const actualMedian = currentImage.median_score;
      
      const isCorrect = this.isNearlyEqual(expectedMedian, actualMedian);
      if (!isCorrect) allCorrect = false;

      progressResults.push({
        step: i + 1,
        addedRating: ratings[i],
        currentRatings: [...currentRatings],
        expectedMedian: expectedMedian,
        actualMedian: actualMedian,
        correct: isCorrect
      });

      console.log(`   Step ${i + 1}: Added ${ratings[i]} → Expected: ${expectedMedian}, Actual: ${actualMedian} ${isCorrect ? '✅' : '❌'}`);
    }

    this.logResult('Progressive Calculation', allCorrect, {
      message: allCorrect ? 'All progressive calculations correct' : 'Some progressive calculations failed',
      progressResults: progressResults,
      totalSteps: ratings.length
    });

    return allCorrect;
  }

  /**
   * Run all median calculation tests
   */
  async runAllTests() {
    console.log('🧮 Starting Median Calculation Validation...\n');
    console.log(`Test ID: ${this.testId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const testResults = [];
    
    testResults.push(await this.testBasicMedianPatterns());
    testResults.push(await this.testStatisticalDistributions());
    testResults.push(await this.testEdgeCases());
    testResults.push(await this.testProgressiveCalculation());

    // Summary
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Median Validation Summary:');
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
    console.log('\n🧹 Cleaning up median test data...');
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
module.exports = { MedianCalculationValidator };

// Run tests if called directly
if (require.main === module) {
  async function runTests() {
    const validator = new MedianCalculationValidator();
    
    try {
      const results = await validator.runAllTests();
      await validator.cleanup();
      
      // Exit with appropriate code
      process.exit(results.failedTests === 0 ? 0 : 1);
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      await validator.cleanup();
      process.exit(1);
    }
  }

  runTests();
}