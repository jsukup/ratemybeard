// Test Data Generator for Rating System Testing
// Creates controlled rating datasets for predictable testing outcomes

const { generateMultipleSessions } = require('./session-bypass-utility');

/**
 * Generate rating distributions for testing median calculations
 */
class RatingDataGenerator {
  constructor() {
    this.distributions = {};
  }

  /**
   * Generate a uniform distribution of ratings
   * @param {number} count - Number of ratings to generate
   * @param {number} min - Minimum rating (default: 0)
   * @param {number} max - Maximum rating (default: 10)
   * @returns {number[]} Array of uniformly distributed ratings
   */
  generateUniform(count, min = 0, max = 10) {
    const ratings = [];
    for (let i = 0; i < count; i++) {
      const rating = min + (max - min) * Math.random();
      ratings.push(Math.round(rating * 100) / 100); // Round to 2 decimals
    }
    return ratings.sort((a, b) => a - b);
  }

  /**
   * Generate a normal (bell curve) distribution of ratings
   * @param {number} count - Number of ratings
   * @param {number} mean - Average rating (default: 5.0)
   * @param {number} stdDev - Standard deviation (default: 1.5)
   * @returns {number[]} Array of normally distributed ratings
   */
  generateNormal(count, mean = 5.0, stdDev = 1.5) {
    const ratings = [];
    
    for (let i = 0; i < count; i++) {
      // Box-Muller transformation for normal distribution
      let u1 = Math.random();
      let u2 = Math.random();
      let z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      let rating = mean + stdDev * z0;
      
      // Clamp to valid range and round
      rating = Math.max(0, Math.min(10, rating));
      ratings.push(Math.round(rating * 100) / 100);
    }
    
    return ratings.sort((a, b) => a - b);
  }

  /**
   * Generate specific rating patterns for median testing
   * @param {string} pattern - Pattern type
   * @param {number} count - Number of ratings (optional for some patterns)
   * @returns {number[]} Array of ratings
   */
  generatePattern(pattern, count = null) {
    switch (pattern) {
      case 'single':
        return [7.5];
      
      case 'even_simple':
        return [2.0, 8.0];
      
      case 'odd_simple':
        return [1.0, 5.0, 9.0];
      
      case 'precision_test':
        return [7.123, 8.456, 5.789];
      
      case 'extremes':
        return [0.00, 10.00];
      
      case 'smoke_show': // High ratings for top category
        return this.generateTargetedDistribution(count || 15, 8.5, 10.0, 0.5);
      
      case 'dregs': // Low ratings for bottom category
        return this.generateTargetedDistribution(count || 15, 0.0, 2.0, 0.5);
      
      case 'mixed_polarized': // Highly polarized ratings
        const half = Math.floor((count || 20) / 2);
        return [
          ...this.generateTargetedDistribution(half, 0.0, 2.0, 0.3),
          ...this.generateTargetedDistribution(half, 8.0, 10.0, 0.3)
        ].sort((a, b) => a - b);
      
      case 'threshold_test': // Exactly around category boundaries
        return [3.9, 4.0, 4.1, 6.9, 7.0, 7.1, 8.4, 8.5, 8.6];
      
      default:
        throw new Error(`Unknown pattern: ${pattern}`);
    }
  }

  /**
   * Generate ratings within a specific range with normal distribution
   * @param {number} count - Number of ratings
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} stdDev - Standard deviation
   * @returns {number[]} Array of ratings
   */
  generateTargetedDistribution(count, min, max, stdDev = 0.5) {
    const mean = (min + max) / 2;
    const ratings = [];
    
    for (let i = 0; i < count; i++) {
      let rating;
      do {
        // Generate normal distribution
        let u1 = Math.random();
        let u2 = Math.random();
        let z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        rating = mean + stdDev * z0;
      } while (rating < min || rating > max);
      
      ratings.push(Math.round(rating * 100) / 100);
    }
    
    return ratings.sort((a, b) => a - b);
  }

  /**
   * Calculate expected median for verification
   * @param {number[]} ratings - Array of ratings
   * @returns {number} Expected median
   */
  calculateExpectedMedian(ratings) {
    if (!ratings || ratings.length === 0) return 0;
    
    const sorted = [...ratings].sort((a, b) => a - b);
    const length = sorted.length;
    const mid = Math.floor(length / 2);
    
    const median = length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
      
    return Math.round(median * 100) / 100;
  }

  /**
   * Generate test scenarios for category transitions
   * @returns {Object} Test scenarios
   */
  generateCategoryTestScenarios() {
    return {
      // Test moving from unrated (9 ratings) to ranked (10+ ratings)
      threshold_crossing: {
        initial_ratings: this.generatePattern('smoke_show', 9),
        additional_rating: 9.2,
        expected_median: this.calculateExpectedMedian([...this.generatePattern('smoke_show', 9), 9.2]),
        expected_category: 'Smoke Shows'
      },

      // Test category changes as median shifts
      category_shift_up: {
        initial_ratings: this.generateTargetedDistribution(12, 6.0, 7.0, 0.3), // Should be "Mehs"
        additional_ratings: [8.5, 8.7, 8.9, 9.1], // Push to higher category
        expected_category: 'Monets'
      },

      category_shift_down: {
        initial_ratings: this.generateTargetedDistribution(10, 7.0, 8.0, 0.3), // Should be "Monets"
        additional_ratings: [2.0, 2.5, 3.0, 3.5], // Pull to lower category
        expected_category: 'Mehs'
      },

      // Edge case: exactly at category boundaries
      boundary_test: {
        ratings_4_0: this.generatePattern('threshold_test'),
        expected_transitions: [
          { median: 3.9, category: 'Plebs' },
          { median: 4.0, category: 'Mehs' },
          { median: 7.0, category: 'Monets' },
          { median: 8.5, category: 'Smoke Shows' }
        ]
      }
    };
  }

  /**
   * Generate stress test data
   * @param {number} imageCount - Number of images to test
   * @param {number} ratingsPerImage - Ratings per image
   * @returns {Object} Stress test dataset
   */
  generateStressTestData(imageCount = 10, ratingsPerImage = 25) {
    const stressData = {
      images: [],
      totalRatings: imageCount * ratingsPerImage,
      expectedProcessingTime: (imageCount * ratingsPerImage * 200), // 200ms per rating estimate
    };

    for (let i = 0; i < imageCount; i++) {
      const ratings = this.generateNormal(ratingsPerImage, 5.0 + Math.random() * 3, 1.2);
      const sessions = generateMultipleSessions(`stress_image_${i}`, ratingsPerImage);
      
      stressData.images.push({
        imageIndex: i,
        ratings: ratings,
        sessions: sessions,
        expectedMedian: this.calculateExpectedMedian(ratings),
        ratingsCount: ratings.length
      });
    }

    return stressData;
  }

  /**
   * Generate concurrent operation test data
   * @param {string} imageId - Target image ID
   * @param {number} concurrentUsers - Number of simultaneous users
   * @returns {Object} Concurrent test data
   */
  generateConcurrentTestData(imageId, concurrentUsers = 50) {
    const ratings = this.generateNormal(concurrentUsers, 6.0, 2.0);
    const sessions = generateMultipleSessions('concurrent_test', concurrentUsers);
    
    return {
      imageId: imageId,
      concurrentUsers: concurrentUsers,
      submissions: ratings.map((rating, index) => ({
        rating: rating,
        sessionId: sessions[index],
        submissionDelay: Math.random() * 100 // 0-100ms random delay
      })),
      expectedMedian: this.calculateExpectedMedian(ratings),
      expectedCount: concurrentUsers
    };
  }
}

/**
 * Validate rating data quality
 * @param {number[]} ratings - Array of ratings to validate
 * @returns {Object} Validation results
 */
function validateRatingData(ratings) {
  const validation = {
    valid: true,
    errors: [],
    statistics: {}
  };

  // Check for valid ratings
  for (let rating of ratings) {
    if (rating < 0 || rating > 10) {
      validation.valid = false;
      validation.errors.push(`Invalid rating: ${rating} (must be 0.00-10.00)`);
    }
    
    if (rating.toString().split('.')[1]?.length > 2) {
      validation.valid = false;
      validation.errors.push(`Invalid precision: ${rating} (max 2 decimal places)`);
    }
  }

  // Calculate statistics
  validation.statistics = {
    count: ratings.length,
    min: Math.min(...ratings),
    max: Math.max(...ratings),
    mean: ratings.reduce((a, b) => a + b, 0) / ratings.length,
    median: new RatingDataGenerator().calculateExpectedMedian(ratings)
  };

  return validation;
}

// Export the generator and utilities
module.exports = {
  RatingDataGenerator,
  validateRatingData
};

// Example usage and testing
if (require.main === module) {
  console.log('🧪 Test Data Generator - Example Usage\n');

  const generator = new RatingDataGenerator();

  // Test basic patterns
  console.log('1. Basic Patterns:');
  console.log('   Single rating:', generator.generatePattern('single'));
  console.log('   Even count:', generator.generatePattern('even_simple'));
  console.log('   Odd count:', generator.generatePattern('odd_simple'));
  
  // Test distributions
  console.log('\n2. Distribution Testing:');
  const normalRatings = generator.generateNormal(10, 7.0, 1.0);
  console.log('   Normal distribution (mean=7.0):', normalRatings);
  console.log('   Expected median:', generator.calculateExpectedMedian(normalRatings));

  // Test category scenarios
  console.log('\n3. Category Test Scenarios:');
  const scenarios = generator.generateCategoryTestScenarios();
  console.log('   Threshold crossing:', scenarios.threshold_crossing);

  // Test stress data
  console.log('\n4. Stress Test Data:');
  const stressData = generator.generateStressTestData(2, 5);
  console.log('   Generated stress data for', stressData.images.length, 'images');
  console.log('   Total ratings:', stressData.totalRatings);

  console.log('\n✅ Test data generator ready for use!');
}