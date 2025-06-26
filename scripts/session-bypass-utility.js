// Session Bypass Utility for Rating System Testing
// Generates unique session IDs to bypass duplicate rating prevention

/**
 * Generate a unique test session ID
 * @param {string} testId - Identifier for the test scenario
 * @param {number} iteration - Iteration number for this test
 * @returns {string} Unique session ID
 */
function generateTestSession(testId = 'default', iteration = 1) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 6);
  return `test_${testId}_${iteration}_${timestamp}_${randomSuffix}`;
}

/**
 * Generate multiple unique session IDs for concurrent testing
 * @param {string} testId - Test scenario identifier
 * @param {number} count - Number of sessions to generate
 * @returns {string[]} Array of unique session IDs
 */
function generateMultipleSessions(testId, count) {
  const sessions = [];
  for (let i = 1; i <= count; i++) {
    sessions.push(generateTestSession(testId, i));
    // Small delay to ensure unique timestamps
    if (i % 10 === 0) {
      // Add microsecond variation for large batches
      const microDelay = Math.random() * 0.001;
    }
  }
  return sessions;
}

/**
 * Create session pool for stress testing
 * @param {number} poolSize - Size of the session pool
 * @returns {Object} Session pool with management functions
 */
function createSessionPool(poolSize = 100) {
  const pool = generateMultipleSessions('stress_test', poolSize);
  let currentIndex = 0;

  return {
    getSession() {
      const session = pool[currentIndex % pool.length];
      currentIndex++;
      return session;
    },
    getAllSessions() {
      return [...pool];
    },
    getPoolSize() {
      return pool.length;
    },
    reset() {
      currentIndex = 0;
    }
  };
}

/**
 * Test session validity (check if it follows expected format)
 * @param {string} sessionId - Session ID to validate
 * @returns {boolean} True if valid test session format
 */
function isValidTestSession(sessionId) {
  const testSessionPattern = /^test_[a-zA-Z0-9_]+_\d+_\d+_[a-z0-9]{6}$/;
  return testSessionPattern.test(sessionId);
}

/**
 * Extract test information from session ID
 * @param {string} sessionId - Test session ID
 * @returns {Object|null} Parsed session info or null if invalid
 */
function parseTestSession(sessionId) {
  if (!isValidTestSession(sessionId)) {
    return null;
  }

  const parts = sessionId.split('_');
  if (parts.length < 5) return null;

  return {
    prefix: parts[0], // 'test'
    testId: parts.slice(1, -3).join('_'), // Everything between test_ and last 3 parts
    iteration: parseInt(parts[parts.length - 3]),
    timestamp: parseInt(parts[parts.length - 2]),
    randomId: parts[parts.length - 1],
    createdAt: new Date(parseInt(parts[parts.length - 2]))
  };
}

/**
 * Clean up test sessions from database (for cleanup utilities)
 * @param {Object} supabase - Supabase client
 * @param {string} testId - Test ID to clean up (optional)
 * @returns {Promise<Object>} Cleanup results
 */
async function cleanupTestSessions(supabase, testId = null) {
  try {
    let query = supabase
      .from('ratings')
      .select('id, session_id')
      .like('session_id', 'test_%');

    if (testId) {
      query = query.like('session_id', `test_${testId}_%`);
    }

    const { data: testRatings, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    if (!testRatings || testRatings.length === 0) {
      return {
        success: true,
        deleted: 0,
        message: 'No test sessions found to clean up'
      };
    }

    const { error: deleteError } = await supabase
      .from('ratings')
      .delete()
      .in('id', testRatings.map(r => r.id));

    if (deleteError) {
      throw deleteError;
    }

    return {
      success: true,
      deleted: testRatings.length,
      message: `Successfully cleaned up ${testRatings.length} test ratings`,
      sessions: testRatings.map(r => r.session_id)
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      deleted: 0
    };
  }
}

/**
 * Submit rating with test session (bypasses normal session logic)
 * @param {string} imageId - Image ID to rate
 * @param {number} rating - Rating value (0.00-10.00)
 * @param {string} sessionId - Test session ID
 * @param {string} baseUrl - API base URL (optional)
 * @returns {Promise<Object>} API response
 */
async function submitTestRating(imageId, rating, sessionId, baseUrl = 'http://localhost:3000') {
  try {
    const response = await fetch(`${baseUrl}/api/ratings/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
      },
      body: JSON.stringify({
        imageId: imageId,
        rating: parseFloat(rating)
      }),
    });

    const result = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data: result,
      sessionId: sessionId,
      imageId: imageId,
      rating: rating
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      sessionId: sessionId,
      imageId: imageId,
      rating: rating
    };
  }
}

// Export functions for use in other test files
module.exports = {
  generateTestSession,
  generateMultipleSessions,
  createSessionPool,
  isValidTestSession,
  parseTestSession,
  cleanupTestSessions,
  submitTestRating
};

// Example usage:
if (require.main === module) {
  console.log('🧪 Session Bypass Utility - Testing Functions\n');

  // Test session generation
  console.log('1. Single session generation:');
  const session1 = generateTestSession('median_test', 1);
  console.log(`   Generated: ${session1}`);
  console.log(`   Valid: ${isValidTestSession(session1)}`);
  console.log(`   Parsed:`, parseTestSession(session1));

  // Test multiple sessions
  console.log('\n2. Multiple session generation:');
  const sessions = generateMultipleSessions('stress_test', 5);
  sessions.forEach((session, i) => {
    console.log(`   Session ${i + 1}: ${session}`);
  });

  // Test session pool
  console.log('\n3. Session pool testing:');
  const pool = createSessionPool(3);
  console.log(`   Pool size: ${pool.getPoolSize()}`);
  console.log(`   Session 1: ${pool.getSession()}`);
  console.log(`   Session 2: ${pool.getSession()}`);
  console.log(`   Session 3: ${pool.getSession()}`);
  console.log(`   Session 4 (wraparound): ${pool.getSession()}`);

  console.log('\n✅ Session bypass utility ready for testing!');
}