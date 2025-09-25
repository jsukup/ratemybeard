#!/usr/bin/env node

// Main Rating System Test Suite Runner
// Orchestrates all test components with comprehensive reporting

const { createClient } = require('@supabase/supabase-js');
const { BasicRatingTests } = require('./basic-rating-tests');
const { MedianCalculationValidator } = require('./median-calculation-validator');
const { StressTestRunner } = require('./stress-test-runner');
const { CategoryTransitionTests } = require('./category-transition-tests');
const { cleanupTestSessions } = require('./session-bypass-utility');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Main Test Suite Runner Class
 */
class RatingTestSuite {
  constructor(options = {}) {
    this.options = {
      runBasicTests: true,
      runMedianTests: true,
      runStressTests: true,
      runCategoryTests: true,
      cleanupOnComplete: true,
      generateReport: true,
      ...options
    };
    
    this.suiteId = `test_suite_${Date.now()}`;
    this.startTime = null;
    this.endTime = null;
    this.results = {};
    this.summary = {};
  }

  /**
   * Display test suite header
   */
  displayHeader() {
    const title = 'RATEMYBEARD RATING SYSTEM TEST SUITE';
    const border = '═'.repeat(title.length + 4);
    
    console.log('\n' + border);
    console.log(`  ${title}  `);
    console.log(border);
    console.log(`Suite ID: ${this.suiteId}`);
    console.log(`Started: ${new Date().toISOString()}`);
    console.log(`Configuration: ${JSON.stringify(this.options, null, 2)}`);
    console.log(border + '\n');
  }

  /**
   * Check system readiness
   */
  async checkSystemReadiness() {
    console.log('🔍 Checking System Readiness...\n');
    
    const checks = [];
    
    // Check database connection
    try {
      const { data, error } = await supabase.from('images').select('count').limit(1);
      checks.push({
        name: 'Database Connection',
        passed: !error,
        details: error ? error.message : 'Connected successfully'
      });
    } catch (error) {
      checks.push({
        name: 'Database Connection',
        passed: false,
        details: error.message
      });
    }

    // Check if images table has data
    try {
      const { data: images, error } = await supabase
        .from('images')
        .select('id, username, rating_count')
        .limit(5);
      
      checks.push({
        name: 'Test Images Available',
        passed: !error && images && images.length >= 3,
        details: error ? error.message : `Found ${images?.length || 0} images for testing`
      });

      if (images && images.length > 0) {
        const unratedImages = images.filter(img => (img.rating_count || 0) < 10).length;
        const ratedImages = images.filter(img => (img.rating_count || 0) >= 10).length;
        
        checks.push({
          name: 'Image Variety',
          passed: unratedImages > 0 && ratedImages > 0,
          details: `${unratedImages} unrated, ${ratedImages} rated images available`
        });
      }
    } catch (error) {
      checks.push({
        name: 'Test Images Available',
        passed: false,
        details: error.message
      });
    }

    // Check ratings table
    try {
      const { data, error } = await supabase.from('ratings').select('count').limit(1);
      checks.push({
        name: 'Ratings Table Access',
        passed: !error,
        details: error ? error.message : 'Ratings table accessible'
      });
    } catch (error) {
      checks.push({
        name: 'Ratings Table Access',
        passed: false,
        details: error.message
      });
    }

    // Display results
    let allPassed = true;
    for (const check of checks) {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.details}`);
      if (!check.passed) allPassed = false;
    }

    if (!allPassed) {
      console.log('\n❌ System readiness checks failed. Aborting test suite.\n');
      return false;
    }

    console.log('\n✅ System ready for testing!\n');
    return true;
  }

  /**
   * Run basic rating tests
   */
  async runBasicTests() {
    if (!this.options.runBasicTests) return null;

    console.log('🧪 Running Basic Rating Tests...\n');
    const basicTests = new BasicRatingTests();
    
    try {
      const results = await basicTests.runAllTests();
      await basicTests.cleanup();
      
      this.results.basic = {
        ...results,
        component: 'BasicRatingTests',
        duration: null, // Duration handled by individual component
        success: results.failedTests === 0
      };
      
      return results;
    } catch (error) {
      console.error('❌ Basic tests failed:', error);
      this.results.basic = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        successRate: 0,
        component: 'BasicRatingTests',
        error: error.message,
        success: false
      };
      return null;
    }
  }

  /**
   * Run median calculation validation
   */
  async runMedianTests() {
    if (!this.options.runMedianTests) return null;

    console.log('\n🧮 Running Median Calculation Validation...\n');
    const medianValidator = new MedianCalculationValidator();
    
    try {
      const results = await medianValidator.runAllTests();
      await medianValidator.cleanup();
      
      this.results.median = {
        ...results,
        component: 'MedianCalculationValidator',
        success: results.failedTests === 0
      };
      
      return results;
    } catch (error) {
      console.error('❌ Median validation failed:', error);
      this.results.median = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        successRate: 0,
        component: 'MedianCalculationValidator',
        error: error.message,
        success: false
      };
      return null;
    }
  }

  /**
   * Run stress tests
   */
  async runStressTests() {
    if (!this.options.runStressTests) return null;

    console.log('\n⚡ Running Stress Tests...\n');
    const stressRunner = new StressTestRunner();
    
    try {
      const results = await stressRunner.runAllTests();
      await stressRunner.cleanup();
      
      this.results.stress = {
        ...results,
        component: 'StressTestRunner',
        success: results.failedTests === 0
      };
      
      return results;
    } catch (error) {
      console.error('❌ Stress tests failed:', error);
      this.results.stress = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        successRate: 0,
        component: 'StressTestRunner',
        error: error.message,
        success: false
      };
      return null;
    }
  }

  /**
   * Run category transition tests
   */
  async runCategoryTests() {
    if (!this.options.runCategoryTests) return null;

    console.log('\n🏆 Running Category Transition Tests...\n');
    const categoryTests = new CategoryTransitionTests();
    
    try {
      const results = await categoryTests.runAllTests();
      await categoryTests.cleanup();
      
      this.results.category = {
        ...results,
        component: 'CategoryTransitionTests',
        success: results.failedTests === 0
      };
      
      return results;
    } catch (error) {
      console.error('❌ Category tests failed:', error);
      this.results.category = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        successRate: 0,
        component: 'CategoryTransitionTests',
        error: error.message,
        success: false
      };
      return null;
    }
  }

  /**
   * Calculate overall summary
   */
  calculateSummary() {
    const components = Object.values(this.results);
    
    this.summary = {
      suiteId: this.suiteId,
      duration: this.endTime - this.startTime,
      startTime: this.startTime,
      endTime: this.endTime,
      componentsRun: components.length,
      totalTests: components.reduce((sum, comp) => sum + comp.totalTests, 0),
      passedTests: components.reduce((sum, comp) => sum + comp.passedTests, 0),
      failedTests: components.reduce((sum, comp) => sum + comp.failedTests, 0),
      overallSuccessRate: 0,
      componentResults: {},
      failedComponents: []
    };

    // Calculate success rate
    if (this.summary.totalTests > 0) {
      this.summary.overallSuccessRate = (this.summary.passedTests / this.summary.totalTests) * 100;
    }

    // Organize component results
    for (const [componentName, result] of Object.entries(this.results)) {
      this.summary.componentResults[componentName] = {
        component: result.component,
        totalTests: result.totalTests,
        passedTests: result.passedTests,
        failedTests: result.failedTests,
        successRate: result.successRate,
        success: result.success
      };

      if (!result.success) {
        this.summary.failedComponents.push(componentName);
      }
    }

    this.summary.overallSuccess = this.summary.failedComponents.length === 0;
  }

  /**
   * Display comprehensive test summary
   */
  displaySummary() {
    const border = '═'.repeat(80);
    const section = '─'.repeat(80);
    
    console.log('\n' + border);
    console.log('  📊 COMPREHENSIVE TEST SUITE SUMMARY');
    console.log(border);
    
    // Overall metrics
    console.log(`Suite ID: ${this.summary.suiteId}`);
    console.log(`Duration: ${(this.summary.duration / 1000).toFixed(1)}s`);
    console.log(`Components Run: ${this.summary.componentsRun}`);
    console.log(`Total Tests: ${this.summary.totalTests}`);
    console.log(`Passed: ${this.summary.passedTests}`);
    console.log(`Failed: ${this.summary.failedTests}`);
    console.log(`Overall Success Rate: ${this.summary.overallSuccessRate.toFixed(1)}%`);
    console.log(`Suite Status: ${this.summary.overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    console.log('\n' + section);
    console.log('  📋 COMPONENT BREAKDOWN');
    console.log(section);
    
    // Component details
    for (const [componentName, result] of Object.entries(this.summary.componentResults)) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.component}:`);
      console.log(`    Tests: ${result.passedTests}/${result.totalTests} passed (${result.successRate.toFixed(1)}%)`);
      
      if (!result.success && this.results[componentName].error) {
        console.log(`    Error: ${this.results[componentName].error}`);
      }
    }
    
    // Failed components
    if (this.summary.failedComponents.length > 0) {
      console.log('\n' + section);
      console.log('  ❌ FAILED COMPONENTS');
      console.log(section);
      
      this.summary.failedComponents.forEach(componentName => {
        const result = this.results[componentName];
        console.log(`• ${result.component}`);
        if (result.error) {
          console.log(`  Error: ${result.error}`);
        }
        if (result.results) {
          const failedTests = result.results.filter(r => !r.success);
          failedTests.forEach(test => {
            console.log(`  - ${test.testName}: ${test.details.error || 'Failed'}`);
          });
        }
      });
    }
    
    console.log('\n' + border);
    
    // Performance insights
    if (this.results.stress && this.results.stress.results) {
      console.log('  ⚡ PERFORMANCE INSIGHTS');
      console.log(section);
      
      const stressResults = this.results.stress.results;
      const perfTest = stressResults.find(r => r.testName === 'Concurrent Single Image');
      if (perfTest && perfTest.details.performance) {
        const perf = perfTest.details.performance;
        console.log(`Concurrent Performance: ${perf.operationsPerSecond.toFixed(1)} ops/sec`);
        console.log(`Average Response Time: ${perf.avgResponseTime.toFixed(0)}ms`);
        console.log(`95th Percentile: ${perf.p95ResponseTime.toFixed(0)}ms`);
      }
      console.log(border);
    }
  }

  /**
   * Final cleanup
   */
  async finalCleanup() {
    if (!this.options.cleanupOnComplete) return;

    console.log('\n🧹 Performing Final Cleanup...');
    
    try {
      const cleanupResult = await cleanupTestSessions(supabase, 'test_');
      console.log(`✅ Final cleanup completed: ${cleanupResult.deleted || 0} test ratings removed`);
    } catch (error) {
      console.log(`⚠️  Final cleanup warning: ${error.message}`);
    }
  }

  /**
   * Generate test report file
   */
  async generateReport() {
    if (!this.options.generateReport) return;

    const reportData = {
      ...this.summary,
      detailedResults: this.results,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        supabaseUrl: supabaseUrl.replace(/\/\/.+@/, '//***@') // Mask credentials
      }
    };

    const reportPath = `/root/ratemybeard/test-reports/rating-suite-${this.suiteId}.json`;
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Ensure directory exists
      const reportDir = path.dirname(reportPath);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`📄 Test report saved: ${reportPath}`);
    } catch (error) {
      console.log(`⚠️  Could not save report: ${error.message}`);
    }
  }

  /**
   * Run the complete test suite
   */
  async runComplete() {
    this.startTime = performance.now();
    
    try {
      this.displayHeader();
      
      // System readiness check
      const systemReady = await this.checkSystemReadiness();
      if (!systemReady) {
        process.exit(1);
      }

      // Run all test components
      await this.runBasicTests();
      await this.runMedianTests();
      await this.runStressTests();
      await this.runCategoryTests();

      this.endTime = performance.now();
      
      // Calculate and display summary
      this.calculateSummary();
      this.displaySummary();
      
      // Generate report
      await this.generateReport();
      
      // Final cleanup
      await this.finalCleanup();
      
      // Return results
      return this.summary;
      
    } catch (error) {
      console.error('\n❌ Test suite execution failed:', error);
      this.endTime = performance.now();
      
      this.summary = {
        suiteId: this.suiteId,
        duration: this.endTime - this.startTime,
        overallSuccess: false,
        error: error.message,
        results: this.results
      };
      
      throw error;
    }
  }
}

// Export for use in other files
module.exports = { RatingTestSuite };

// Command line interface
if (require.main === module) {
  async function main() {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line options
    if (args.includes('--basic-only')) {
      options.runBasicTests = true;
      options.runMedianTests = false;
      options.runStressTests = false;
      options.runCategoryTests = false;
    }
    
    if (args.includes('--no-cleanup')) {
      options.cleanupOnComplete = false;
    }
    
    if (args.includes('--no-report')) {
      options.generateReport = false;
    }

    const testSuite = new RatingTestSuite(options);
    
    try {
      const results = await testSuite.runComplete();
      
      // Exit with appropriate code
      process.exit(results.overallSuccess ? 0 : 1);
      
    } catch (error) {
      console.error('\n💥 Test suite crashed:', error);
      process.exit(1);
    }
  }

  // Display usage if help requested
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
🧪 Rating System Test Suite

Usage: node rating-test-suite.js [options]

Options:
  --basic-only    Run only basic rating tests
  --no-cleanup    Skip final cleanup of test data
  --no-report     Skip generating test report file
  --help, -h      Show this help message

Examples:
  node rating-test-suite.js                    # Run complete test suite
  node rating-test-suite.js --basic-only       # Run only basic tests
  node rating-test-suite.js --no-cleanup       # Keep test data after run
    `);
    process.exit(0);
  }

  main();
}