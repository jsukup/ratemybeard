// Category Transition Testing Framework
// Tests image movement between ranking categories based on median score changes

const { createClient } = require('@supabase/supabase-js');
const { 
  generateMultipleSessions,
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
 * Category definitions based on median scores
 */
const CATEGORIES = {
  'Smoke Shows': { min: 8.5, max: 10.0 },
  'Monets': { min: 7.0, max: 8.49 },
  'Mehs': { min: 4.0, max: 6.99 },
  'Plebs': { min: 2.0, max: 3.99 },
  'Dregs': { min: 0.0, max: 1.99 }
};

/**
 * Category Transition Tests Class
 */
class CategoryTransitionTests {
  constructor() {
    this.testResults = [];
    this.testId = `category_test_${Date.now()}`;
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
   * Determine category based on median score
   */
  getCategoryForScore(medianScore) {
    for (const [categoryName, range] of Object.entries(CATEGORIES)) {
      if (medianScore >= range.min && medianScore <= range.max) {
        return categoryName;
      }
    }
    return 'Unknown';
  }

  /**
   * Submit ratings and wait for processing
   */
  async submitRatingsAndWait(imageId, ratings, sessionPrefix) {
    const sessions = generateMultipleSessions(`${this.testId}_${sessionPrefix}`, ratings.length);
    const results = [];

    for (let i = 0; i < ratings.length; i++) {
      const result = await submitTestRating(imageId, ratings[i], sessions[i]);
      results.push(result);
      
      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Wait for database processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    return results;
  }

  /**
   * Get current image state from database
   */
  async getImageState(imageId) {
    const { data: image, error } = await supabase
      .from('images')
      .select('id, username, median_score, rating_count')
      .eq('id', imageId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch image: ${error.message}`);
    }

    return {
      ...image,
      isRanked: image.rating_count >= 10,
      category: image.rating_count >= 10 ? this.getCategoryForScore(image.median_score) : 'Unrated',
      needsRatings: Math.max(0, 10 - image.rating_count)
    };
  }

  /**
   * Test 1: Threshold crossing from unrated to ranked
   */
  async testThresholdCrossing() {
    console.log('🚀 Testing Threshold Crossing (Unrated → Ranked)...\n');

    const { data: images, error } = await supabase
      .from('images')
      .select('id, username, rating_count')
      .lt('rating_count', 10)
      .limit(1);

    if (error || !images || images.length === 0) {
      this.logResult('Threshold Crossing', false, { 
        error: 'No images with <10 ratings available for testing' 
      });
      return false;
    }

    const testImage = images[0];
    const initialState = await this.getImageState(testImage.id);
    
    console.log(`   Test Image: ${testImage.username}`);
    console.log(`   Initial State: ${initialState.rating_count} ratings, needs ${initialState.needsRatings} more`);

    // Calculate ratings needed to reach exactly 10
    const ratingsNeeded = Math.max(1, initialState.needsRatings);
    const targetCategory = 'Smoke Shows';
    const targetRatings = generator.generatePattern('smoke_show', ratingsNeeded);

    console.log(`   Adding ${ratingsNeeded} ratings: [${targetRatings.slice(0, 3).join(', ')}...]`);
    console.log(`   Target category: ${targetCategory}`);

    // Submit the ratings
    const results = await this.submitRatingsAndWait(testImage.id, targetRatings, 'threshold');
    const successfulSubmissions = results.filter(r => r.success).length;

    // Check final state
    const finalState = await this.getImageState(testImage.id);
    const expectedMedian = generator.calculateExpectedMedian(targetRatings);

    console.log(`\n   📊 Results:`);
    console.log(`      Successful submissions: ${successfulSubmissions}/${ratingsNeeded}`);
    console.log(`      Final rating count: ${finalState.rating_count}`);
    console.log(`      Final median: ${finalState.median_score}`);
    console.log(`      Is ranked: ${finalState.isRanked}`);
    console.log(`      Category: ${finalState.category}`);

    const testPassed = 
      finalState.isRanked && 
      finalState.rating_count >= 10 &&
      finalState.category === targetCategory &&
      successfulSubmissions >= ratingsNeeded * 0.8;

    this.logResult('Threshold Crossing', testPassed, {
      message: `Image transitioned from unrated to ${finalState.category}`,
      initialCount: initialState.rating_count,
      finalCount: finalState.rating_count,
      finalMedian: finalState.median_score,
      finalCategory: finalState.category,
      successfulSubmissions: successfulSubmissions
    });

    return testPassed;
  }

  /**
   * Test 2: Category upward movement
   */
  async testCategoryUpwardMovement() {
    console.log('\n⬆️  Testing Category Upward Movement...\n');

    const { data: images, error } = await supabase
      .from('images')
      .select('id, username, median_score, rating_count')
      .gte('rating_count', 10)
      .lt('median_score', 7.0) // Start with lower categories
      .limit(1);

    if (error || !images || images.length === 0) {
      this.logResult('Category Upward Movement', false, { 
        error: 'No ranked images with median <7.0 available for testing' 
      });
      return false;
    }

    const testImage = images[0];
    const initialState = await this.getImageState(testImage.id);
    
    console.log(`   Test Image: ${testImage.username}`);
    console.log(`   Initial: ${initialState.rating_count} ratings, median ${initialState.median_score}, category: ${initialState.category}`);

    // Add high ratings to push into higher category
    const boostRatings = [8.5, 8.7, 8.9, 9.1, 9.3]; // Should push median upward
    const expectedNewCategory = 'Monets'; // Should reach at least Monets category

    console.log(`   Adding boost ratings: [${boostRatings.join(', ')}]`);
    console.log(`   Expected movement: ${initialState.category} → ${expectedNewCategory} (or higher)`);

    const results = await this.submitRatingsAndWait(testImage.id, boostRatings, 'upward');
    const successfulSubmissions = results.filter(r => r.success).length;

    const finalState = await this.getImageState(testImage.id);

    console.log(`\n   📊 Results:`);
    console.log(`      Successful submissions: ${successfulSubmissions}/${boostRatings.length}`);
    console.log(`      Final rating count: ${finalState.rating_count}`);
    console.log(`      Final median: ${finalState.median_score}`);
    console.log(`      Category movement: ${initialState.category} → ${finalState.category}`);

    const categoryImproved = 
      (initialState.category === 'Dregs' && ['Plebs', 'Mehs', 'Monets', 'Smoke Shows'].includes(finalState.category)) ||
      (initialState.category === 'Plebs' && ['Mehs', 'Monets', 'Smoke Shows'].includes(finalState.category)) ||
      (initialState.category === 'Mehs' && ['Monets', 'Smoke Shows'].includes(finalState.category));

    const testPassed = 
      finalState.median_score > initialState.median_score &&
      categoryImproved &&
      successfulSubmissions >= boostRatings.length * 0.8;

    this.logResult('Category Upward Movement', testPassed, {
      message: `Category moved from ${initialState.category} to ${finalState.category}`,
      initialMedian: initialState.median_score,
      finalMedian: finalState.median_score,
      medianIncrease: finalState.median_score - initialState.median_score,
      categoryImproved: categoryImproved
    });

    return testPassed;
  }

  /**
   * Test 3: Category downward movement
   */
  async testCategoryDownwardMovement() {
    console.log('\n⬇️  Testing Category Downward Movement...\n');

    const { data: images, error } = await supabase
      .from('images')
      .select('id, username, median_score, rating_count')
      .gte('rating_count', 10)
      .gt('median_score', 4.0) // Start with higher categories
      .limit(1);

    if (error || !images || images.length === 0) {
      this.logResult('Category Downward Movement', false, { 
        error: 'No ranked images with median >4.0 available for testing' 
      });
      return false;
    }

    const testImage = images[0];
    const initialState = await this.getImageState(testImage.id);
    
    console.log(`   Test Image: ${testImage.username}`);
    console.log(`   Initial: ${initialState.rating_count} ratings, median ${initialState.median_score}, category: ${initialState.category}`);

    // Add low ratings to push into lower category
    const lowRatings = [1.0, 1.5, 2.0, 2.5, 3.0]; // Should pull median downward

    console.log(`   Adding low ratings: [${lowRatings.join(', ')}]`);
    console.log(`   Expected: Category should move down`);

    const results = await this.submitRatingsAndWait(testImage.id, lowRatings, 'downward');
    const successfulSubmissions = results.filter(r => r.success).length;

    const finalState = await this.getImageState(testImage.id);

    console.log(`\n   📊 Results:`);
    console.log(`      Successful submissions: ${successfulSubmissions}/${lowRatings.length}`);
    console.log(`      Final rating count: ${finalState.rating_count}`);
    console.log(`      Final median: ${finalState.median_score}`);
    console.log(`      Category movement: ${initialState.category} → ${finalState.category}`);

    const categoryDeclined = 
      (initialState.category === 'Smoke Shows' && ['Monets', 'Mehs', 'Plebs', 'Dregs'].includes(finalState.category)) ||
      (initialState.category === 'Monets' && ['Mehs', 'Plebs', 'Dregs'].includes(finalState.category)) ||
      (initialState.category === 'Mehs' && ['Plebs', 'Dregs'].includes(finalState.category));

    const testPassed = 
      finalState.median_score < initialState.median_score &&
      categoryDeclined &&
      successfulSubmissions >= lowRatings.length * 0.8;

    this.logResult('Category Downward Movement', testPassed, {
      message: `Category moved from ${initialState.category} to ${finalState.category}`,
      initialMedian: initialState.median_score,
      finalMedian: finalState.median_score,
      medianDecrease: initialState.median_score - finalState.median_score,
      categoryDeclined: categoryDeclined
    });

    return testPassed;
  }

  /**
   * Test 4: Boundary testing (exact category thresholds)
   */
  async testCategoryBoundaries() {
    console.log('\n🎯 Testing Category Boundaries...\n');

    const { data: images, error } = await supabase
      .from('images')
      .select('id, username')
      .limit(1);

    if (error || !images || images.length === 0) {
      this.logResult('Category Boundaries', false, { 
        error: 'No test images available' 
      });
      return false;
    }

    const testImage = images[0];
    
    // Test ratings that should place image exactly at category boundaries
    const boundaryTests = [
      { ratings: [4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0], expectedCategory: 'Mehs', name: 'Mehs Lower Boundary (4.0)' },
      { ratings: [7.0, 7.0, 7.0, 7.0, 7.0, 7.0, 7.0, 7.0, 7.0, 7.0], expectedCategory: 'Monets', name: 'Monets Lower Boundary (7.0)' },
      { ratings: [8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5], expectedCategory: 'Smoke Shows', name: 'Smoke Shows Lower Boundary (8.5)' }
    ];

    let passedBoundaryTests = 0;

    for (const boundaryTest of boundaryTests) {
      console.log(`\n   Testing: ${boundaryTest.name}`);
      console.log(`   Ratings: [${boundaryTest.ratings[0]} × ${boundaryTest.ratings.length}]`);
      console.log(`   Expected median: ${boundaryTest.ratings[0]}, Expected category: ${boundaryTest.expectedCategory}`);

      const results = await this.submitRatingsAndWait(testImage.id, boundaryTest.ratings, `boundary_${passedBoundaryTests}`);
      const successfulSubmissions = results.filter(r => r.success).length;

      await new Promise(resolve => setTimeout(resolve, 500)); // Extra wait for boundary cases

      const finalState = await this.getImageState(testImage.id);
      const medianCorrect = Math.abs(finalState.median_score - boundaryTest.ratings[0]) <= 0.01;
      const categoryCorrect = finalState.category === boundaryTest.expectedCategory;

      console.log(`      Result: Median ${finalState.median_score}, Category ${finalState.category}`);
      console.log(`      Median correct: ${medianCorrect}, Category correct: ${categoryCorrect}`);

      if (medianCorrect && categoryCorrect && successfulSubmissions >= boundaryTest.ratings.length * 0.8) {
        passedBoundaryTests++;
      }

      // Clean up for next test
      const cleanupResult = await cleanupTestSessions(supabase, `${this.testId}_boundary_${passedBoundaryTests - 1}`);
      console.log(`      Cleaned up ${cleanupResult.deleted || 0} test ratings`);
    }

    const testPassed = passedBoundaryTests === boundaryTests.length;

    this.logResult('Category Boundaries', testPassed, {
      message: `${passedBoundaryTests}/${boundaryTests.length} boundary tests passed`,
      passedTests: passedBoundaryTests,
      totalTests: boundaryTests.length
    });

    return testPassed;
  }

  /**
   * Run all category transition tests
   */
  async runAllTests() {
    console.log('🏆 Starting Category Transition Tests...\n');
    console.log(`Test ID: ${this.testId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const testResults = [];
    
    testResults.push(await this.testThresholdCrossing());
    testResults.push(await this.testCategoryUpwardMovement());
    testResults.push(await this.testCategoryDownwardMovement());
    testResults.push(await this.testCategoryBoundaries());

    // Summary
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Category Transition Summary:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.testName}: ${r.details.error || 'See details above'}`));
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
    console.log('\n🧹 Cleaning up category test data...');
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
module.exports = { CategoryTransitionTests, CATEGORIES };

// Run tests if called directly
if (require.main === module) {
  async function runTests() {
    const tests = new CategoryTransitionTests();
    
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