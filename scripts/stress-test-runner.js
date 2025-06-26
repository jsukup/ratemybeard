// Stress Test Runner for Rating System
// Tests concurrent operations, performance limits, and system stability

const { createClient } = require('@supabase/supabase-js');
const { 
  generateMultipleSessions,
  createSessionPool,
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
 * Performance metrics collector
 */
class PerformanceMetrics {
  constructor() {
    this.reset();
  }

  reset() {
    this.startTime = null;
    this.endTime = null;
    this.operationTimes = [];
    this.successCount = 0;
    this.failureCount = 0;
    this.errors = [];
  }

  start() {
    this.startTime = performance.now();
  }

  end() {
    this.endTime = performance.now();
  }

  recordOperation(startTime, endTime, success, error = null) {
    const duration = endTime - startTime;
    this.operationTimes.push(duration);
    
    if (success) {
      this.successCount++;
    } else {
      this.failureCount++;
      if (error) this.errors.push(error);
    }
  }

  getStats() {
    const totalDuration = this.endTime - this.startTime;
    const operations = this.operationTimes;
    
    if (operations.length === 0) {
      return { totalDuration, operationsPerSecond: 0, avgResponseTime: 0 };
    }

    operations.sort((a, b) => a - b);
    
    return {
      totalDuration: totalDuration,
      totalOperations: operations.length,
      successCount: this.successCount,
      failureCount: this.failureCount,
      successRate: (this.successCount / operations.length) * 100,
      operationsPerSecond: (operations.length / totalDuration) * 1000,
      avgResponseTime: operations.reduce((a, b) => a + b, 0) / operations.length,
      minResponseTime: operations[0],
      maxResponseTime: operations[operations.length - 1],
      medianResponseTime: operations[Math.floor(operations.length / 2)],
      p95ResponseTime: operations[Math.floor(operations.length * 0.95)],
      p99ResponseTime: operations[Math.floor(operations.length * 0.99)],
      errors: this.errors
    };
  }
}

/**
 * Stress Test Runner Class
 */
class StressTestRunner {
  constructor() {
    this.testResults = [];
    this.testId = `stress_test_${Date.now()}`;
    this.metrics = new PerformanceMetrics();
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
    if (details.message) {
      console.log(`   ${details.message}`);
    }
  }

  /**
   * Submit ratings concurrently with controlled timing
   */
  async submitConcurrentRatings(imageId, ratings, sessions, maxConcurrency = 10) {
    const results = [];
    const semaphore = new Array(maxConcurrency).fill(null);
    
    const submitBatch = async (batchRatings, batchSessions) => {
      const batchPromises = batchRatings.map(async (rating, index) => {
        const sessionId = batchSessions[index];
        const operationStart = performance.now();
        
        try {
          const result = await submitTestRating(imageId, rating, sessionId);
          const operationEnd = performance.now();
          
          this.metrics.recordOperation(operationStart, operationEnd, result.success, result.error);
          return result;
        } catch (error) {
          const operationEnd = performance.now();
          this.metrics.recordOperation(operationStart, operationEnd, false, error.message);
          return { success: false, error: error.message, sessionId, rating };
        }
      });
      
      return Promise.all(batchPromises);
    };

    // Process in batches to control concurrency
    for (let i = 0; i < ratings.length; i += maxConcurrency) {
      const batchRatings = ratings.slice(i, i + maxConcurrency);
      const batchSessions = sessions.slice(i, i + maxConcurrency);
      
      const batchResults = await submitBatch(batchRatings, batchSessions);
      results.push(...batchResults);
      
      // Small delay between batches to prevent overwhelming
      if (i + maxConcurrency < ratings.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Test 1: Concurrent rating submissions to single image
   */
  async testConcurrentSingleImage() {
    console.log('⚡ Testing Concurrent Submissions to Single Image...\n');

    const { data: images, error } = await supabase
      .from('images')
      .select('id, username')
      .limit(1);

    if (error || !images || images.length === 0) {
      this.logResult('Concurrent Single Image', false, { 
        message: 'No test images available' 
      });
      return false;
    }

    const testImage = images[0];
    const concurrentUsers = 25;
    const ratings = generator.generateNormal(concurrentUsers, 6.0, 2.0);
    const sessions = generateMultipleSessions(`${this.testId}_concurrent`, concurrentUsers);

    console.log(`   Target Image: ${testImage.username}`);
    console.log(`   Concurrent Users: ${concurrentUsers}`);
    console.log(`   Sample Ratings: [${ratings.slice(0, 5).join(', ')}...]`);

    this.metrics.reset();
    this.metrics.start();

    const results = await this.submitConcurrentRatings(testImage.id, ratings, sessions, 10);

    this.metrics.end();
    const stats = this.metrics.getStats();

    const successfulSubmissions = results.filter(r => r.success).length;
    const successRate = (successfulSubmissions / concurrentUsers) * 100;

    console.log(`\n   📊 Results:`);
    console.log(`      Successful: ${successfulSubmissions}/${concurrentUsers} (${successRate.toFixed(1)}%)`);
    console.log(`      Total Time: ${stats.totalDuration.toFixed(0)}ms`);
    console.log(`      Avg Response: ${stats.avgResponseTime.toFixed(0)}ms`);
    console.log(`      Operations/sec: ${stats.operationsPerSecond.toFixed(1)}`);
    console.log(`      95th percentile: ${stats.p95ResponseTime.toFixed(0)}ms`);

    // Verify database consistency
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for processing
    
    const { data: updatedImage } = await supabase
      .from('images')
      .select('rating_count, median_score')
      .eq('id', testImage.id)
      .single();

    const testPassed = successRate >= 90 && stats.avgResponseTime < 1000; // 90% success, <1s avg response

    this.logResult('Concurrent Single Image', testPassed, {
      message: `${successfulSubmissions}/${concurrentUsers} successful, ${stats.avgResponseTime.toFixed(0)}ms avg response`,
      performance: stats,
      finalRatingCount: updatedImage?.rating_count,
      finalMedian: updatedImage?.median_score
    });

    return testPassed;
  }

  /**
   * Test 2: Distributed load across multiple images
   */
  async testDistributedLoad() {
    console.log('\n🌐 Testing Distributed Load Across Multiple Images...\n');

    const { data: images, error } = await supabase
      .from('images')
      .select('id, username')
      .limit(5);

    if (error || !images || images.length < 3) {
      this.logResult('Distributed Load', false, { 
        message: 'Need at least 3 test images available' 
      });
      return false;
    }

    const ratingsPerImage = 10;
    const totalOperations = images.length * ratingsPerImage;
    const allSubmissions = [];

    console.log(`   Target Images: ${images.length}`);
    console.log(`   Ratings per Image: ${ratingsPerImage}`);
    console.log(`   Total Operations: ${totalOperations}`);

    this.metrics.reset();
    this.metrics.start();

    // Create submissions for all images
    for (let i = 0; i < images.length; i++) {
      const imageRatings = generator.generateNormal(ratingsPerImage, 5.0 + Math.random() * 3, 1.5);
      const imageSessions = generateMultipleSessions(`${this.testId}_dist_${i}`, ratingsPerImage);
      
      for (let j = 0; j < ratingsPerImage; j++) {
        allSubmissions.push({
          imageId: images[i].id,
          rating: imageRatings[j],
          sessionId: imageSessions[j],
          imageIndex: i
        });
      }
    }

    // Shuffle submissions to simulate real-world distribution
    for (let i = allSubmissions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allSubmissions[i], allSubmissions[j]] = [allSubmissions[j], allSubmissions[i]];
    }

    // Submit all ratings concurrently
    const submissionPromises = allSubmissions.map(async (submission) => {
      const operationStart = performance.now();
      
      try {
        const result = await submitTestRating(submission.imageId, submission.rating, submission.sessionId);
        const operationEnd = performance.now();
        
        this.metrics.recordOperation(operationStart, operationEnd, result.success, result.error);
        return { ...result, imageIndex: submission.imageIndex };
      } catch (error) {
        const operationEnd = performance.now();
        this.metrics.recordOperation(operationStart, operationEnd, false, error.message);
        return { success: false, error: error.message, imageIndex: submission.imageIndex };
      }
    });

    const results = await Promise.all(submissionPromises);

    this.metrics.end();
    const stats = this.metrics.getStats();

    const successfulSubmissions = results.filter(r => r.success).length;
    const successRate = (successfulSubmissions / totalOperations) * 100;

    console.log(`\n   📊 Results:`);
    console.log(`      Successful: ${successfulSubmissions}/${totalOperations} (${successRate.toFixed(1)}%)`);
    console.log(`      Total Time: ${stats.totalDuration.toFixed(0)}ms`);
    console.log(`      Avg Response: ${stats.avgResponseTime.toFixed(0)}ms`);
    console.log(`      Operations/sec: ${stats.operationsPerSecond.toFixed(1)}`);

    // Check per-image success rates
    const imageStats = {};
    for (const result of results) {
      const imageIndex = result.imageIndex;
      if (!imageStats[imageIndex]) {
        imageStats[imageIndex] = { success: 0, total: 0 };
      }
      imageStats[imageIndex].total++;
      if (result.success) imageStats[imageIndex].success++;
    }

    console.log(`\n   Per-Image Success Rates:`);
    for (const [imageIndex, stats] of Object.entries(imageStats)) {
      const rate = (stats.success / stats.total) * 100;
      console.log(`      Image ${parseInt(imageIndex) + 1}: ${stats.success}/${stats.total} (${rate.toFixed(1)}%)`);
    }

    const testPassed = successRate >= 85 && stats.avgResponseTime < 1500;

    this.logResult('Distributed Load', testPassed, {
      message: `${successfulSubmissions}/${totalOperations} successful across ${images.length} images`,
      performance: stats,
      imageStats: imageStats
    });

    return testPassed;
  }

  /**
   * Test 3: High-volume rapid submissions
   */
  async testHighVolumeRapid() {
    console.log('\n🚀 Testing High-Volume Rapid Submissions...\n');

    const { data: images, error } = await supabase
      .from('images')
      .select('id, username')
      .limit(2);

    if (error || !images || images.length < 2) {
      this.logResult('High Volume Rapid', false, { 
        message: 'Need at least 2 test images available' 
      });
      return false;
    }

    const rapidSubmissions = 50;
    const timeWindow = 10000; // 10 seconds
    const targetRate = rapidSubmissions / (timeWindow / 1000); // submissions per second

    console.log(`   Target Submissions: ${rapidSubmissions}`);
    console.log(`   Time Window: ${timeWindow / 1000}s`);
    console.log(`   Target Rate: ${targetRate.toFixed(1)} submissions/sec`);

    const stressData = generator.generateStressTestData(2, rapidSubmissions / 2);
    const allSubmissions = [];

    // Prepare all submissions
    for (let i = 0; i < 2; i++) {
      const imageData = stressData.images[i];
      for (let j = 0; j < imageData.ratings.length; j++) {
        allSubmissions.push({
          imageId: images[i].id,
          rating: imageData.ratings[j],
          sessionId: imageData.sessions[j],
          delay: (j * timeWindow) / imageData.ratings.length // Spread over time window
        });
      }
    }

    this.metrics.reset();
    this.metrics.start();

    // Submit with precise timing
    const submissionPromises = allSubmissions.map(async (submission, index) => {
      // Wait for scheduled time
      await new Promise(resolve => setTimeout(resolve, submission.delay));
      
      const operationStart = performance.now();
      
      try {
        const result = await submitTestRating(submission.imageId, submission.rating, submission.sessionId);
        const operationEnd = performance.now();
        
        this.metrics.recordOperation(operationStart, operationEnd, result.success, result.error);
        return result;
      } catch (error) {
        const operationEnd = performance.now();
        this.metrics.recordOperation(operationStart, operationEnd, false, error.message);
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(submissionPromises);

    this.metrics.end();
    const stats = this.metrics.getStats();

    const successfulSubmissions = results.filter(r => r.success).length;
    const actualRate = stats.operationsPerSecond;
    const successRate = (successfulSubmissions / rapidSubmissions) * 100;

    console.log(`\n   📊 Results:`);
    console.log(`      Successful: ${successfulSubmissions}/${rapidSubmissions} (${successRate.toFixed(1)}%)`);
    console.log(`      Actual Rate: ${actualRate.toFixed(1)} ops/sec`);
    console.log(`      Avg Response: ${stats.avgResponseTime.toFixed(0)}ms`);
    console.log(`      Max Response: ${stats.maxResponseTime.toFixed(0)}ms`);
    console.log(`      Error Rate: ${((stats.errors.length / rapidSubmissions) * 100).toFixed(1)}%`);

    const testPassed = successRate >= 80 && actualRate >= targetRate * 0.8;

    this.logResult('High Volume Rapid', testPassed, {
      message: `${successfulSubmissions}/${rapidSubmissions} at ${actualRate.toFixed(1)} ops/sec`,
      performance: stats,
      targetRate: targetRate,
      actualRate: actualRate
    });

    return testPassed;
  }

  /**
   * Test 4: Database consistency under stress
   */
  async testDatabaseConsistency() {
    console.log('\n🗄️  Testing Database Consistency Under Stress...\n');

    const { data: images, error } = await supabase
      .from('images')
      .select('id, username, rating_count, median_score')
      .limit(1);

    if (error || !images || images.length === 0) {
      this.logResult('Database Consistency', false, { 
        message: 'No test images available' 
      });
      return false;
    }

    const testImage = images[0];
    const initialCount = testImage.rating_count || 0;
    const initialMedian = testImage.median_score || 0;

    // Create controlled dataset for predictable median
    const testRatings = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
    const expectedMedian = generator.calculateExpectedMedian(testRatings);
    const sessions = generateMultipleSessions(`${this.testId}_consistency`, testRatings.length);

    console.log(`   Test Image: ${testImage.username}`);
    console.log(`   Initial Count: ${initialCount}, Initial Median: ${initialMedian}`);
    console.log(`   Test Ratings: [${testRatings.join(', ')}]`);
    console.log(`   Expected Median: ${expectedMedian}`);

    // Submit ratings rapidly
    const results = await this.submitConcurrentRatings(testImage.id, testRatings, sessions, 5);
    const successfulSubmissions = results.filter(r => r.success).length;

    // Wait for all database operations to complete
    console.log('\n   Waiting for database consistency...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify final state
    const { data: finalImage } = await supabase
      .from('images')
      .select('rating_count, median_score')
      .eq('id', testImage.id)
      .single();

    const finalCount = finalImage.rating_count;
    const finalMedian = finalImage.median_score;
    const expectedFinalCount = initialCount + successfulSubmissions;

    const countCorrect = finalCount >= expectedFinalCount; // May be higher due to other tests
    const medianInRange = Math.abs(finalMedian - expectedMedian) <= 1.0; // Allow some tolerance

    console.log(`\n   📊 Consistency Results:`);
    console.log(`      Submitted: ${successfulSubmissions}/${testRatings.length} ratings`);
    console.log(`      Final Count: ${finalCount} (expected ≥ ${expectedFinalCount})`);
    console.log(`      Final Median: ${finalMedian} (expected ~${expectedMedian})`);
    console.log(`      Count Correct: ${countCorrect ? 'Yes' : 'No'}`);
    console.log(`      Median Reasonable: ${medianInRange ? 'Yes' : 'No'}`);

    const testPassed = countCorrect && medianInRange && successfulSubmissions >= testRatings.length * 0.8;

    this.logResult('Database Consistency', testPassed, {
      message: `Count: ${finalCount}/${expectedFinalCount}, Median: ${finalMedian}`,
      initialState: { count: initialCount, median: initialMedian },
      finalState: { count: finalCount, median: finalMedian },
      expectedFinalCount: expectedFinalCount,
      expectedMedian: expectedMedian,
      countCorrect: countCorrect,
      medianInRange: medianInRange
    });

    return testPassed;
  }

  /**
   * Run all stress tests
   */
  async runAllTests() {
    console.log('⚡ Starting Stress Test Suite...\n');
    console.log(`Test ID: ${this.testId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const testResults = [];
    
    testResults.push(await this.testConcurrentSingleImage());
    testResults.push(await this.testDistributedLoad());
    testResults.push(await this.testHighVolumeRapid());
    testResults.push(await this.testDatabaseConsistency());

    // Summary
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Stress Test Summary:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.testName}`));
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
    console.log('\n🧹 Cleaning up stress test data...');
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
module.exports = { StressTestRunner, PerformanceMetrics };

// Run tests if called directly
if (require.main === module) {
  async function runTests() {
    const runner = new StressTestRunner();
    
    try {
      const results = await runner.runAllTests();
      await runner.cleanup();
      
      // Exit with appropriate code
      process.exit(results.failedTests === 0 ? 0 : 1);
    } catch (error) {
      console.error('❌ Stress test execution failed:', error);
      await runner.cleanup();
      process.exit(1);
    }
  }

  runTests();
}