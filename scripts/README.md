# RateMyFeet Rating System Test Suite

A comprehensive testing framework for validating the rating system functionality, database consistency, and performance under various conditions.

## Overview

The test suite consists of multiple specialized testing components that validate different aspects of the rating system:

1. **Basic Rating Tests** - Core functionality validation
2. **Median Calculation Validator** - Mathematical precision testing
3. **Stress Test Runner** - Performance and concurrency testing
4. **Category Transition Tests** - Ranking category movement validation
5. **Main Test Runner** - Orchestrates all components with comprehensive reporting

## Quick Start

### Prerequisites

- Node.js environment with access to the RateMyFeet codebase
- Supabase environment variables configured:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
  ```
- At least 5 images in the database for comprehensive testing

### Running the Complete Test Suite

```bash
# Run all tests with full reporting
node scripts/rating-test-suite.js

# Run only basic tests (faster, good for quick validation)
node scripts/rating-test-suite.js --basic-only

# Run without cleanup (keep test data for inspection)
node scripts/rating-test-suite.js --no-cleanup

# Run without generating report file
node scripts/rating-test-suite.js --no-report
```

### Running Individual Test Components

```bash
# Basic functionality tests
node scripts/basic-rating-tests.js

# Median calculation validation
node scripts/median-calculation-validator.js

# Stress testing
node scripts/stress-test-runner.js

# Category transition testing
node scripts/category-transition-tests.js
```

## Test Components

### 1. Basic Rating Tests (`basic-rating-tests.js`)

**Purpose**: Validates core rating submission functionality

**Tests Include**:
- Single rating submission and database storage
- Multiple ratings with session bypass
- Rating validation (boundary testing)
- Database integrity checks
- Duplicate prevention verification

**Key Features**:
- Session bypass utility for testing multiple ratings
- Validation of 0.00-10.00 rating range
- Database foreign key integrity verification

### 2. Median Calculation Validator (`median-calculation-validator.js`)

**Purpose**: Ensures mathematical accuracy of median calculations

**Tests Include**:
- Basic median patterns (single, even count, odd count)
- Statistical distributions (normal, uniform, targeted)
- Edge cases and boundary conditions
- Progressive median calculation (adding ratings one by one)

**Key Features**:
- Controlled rating datasets with predictable outcomes
- Floating-point precision validation (±0.01 tolerance)
- Large dataset testing (up to 50 ratings)

### 3. Stress Test Runner (`stress-test-runner.js`)

**Purpose**: Performance testing under high load and concurrent operations

**Tests Include**:
- Concurrent submissions to single image (25 users)
- Distributed load across multiple images
- High-volume rapid submissions (50 ops in 10 seconds)
- Database consistency under stress

**Key Features**:
- Performance metrics collection (ops/sec, response times)
- Controlled concurrency with batch processing
- Database consistency verification after stress
- 95th and 99th percentile response time tracking

### 4. Category Transition Tests (`category-transition-tests.js`)

**Purpose**: Validates image movement between ranking categories

**Tests Include**:
- Threshold crossing (unrated → ranked at 10 ratings)
- Category upward movement (adding high ratings)
- Category downward movement (adding low ratings)
- Boundary testing (exact category thresholds)

**Key Features**:
- Category definitions: Smoke Shows (8.5+), Monets (7.0-8.49), Mehs (4.0-6.99), Plebs (2.0-3.99), Dregs (0.0-1.99)
- Real-time category change validation
- Boundary condition testing (exact threshold values)

### 5. Main Test Runner (`rating-test-suite.js`)

**Purpose**: Orchestrates all test components with comprehensive reporting

**Features**:
- System readiness checks before testing
- Component execution with error handling
- Comprehensive summary reporting
- JSON report generation
- Configurable test component selection
- Automatic cleanup with option to preserve test data

## Session Bypass System

The test suite includes a sophisticated session bypass system that allows testing multiple ratings per image without triggering duplicate prevention:

### Key Files:
- `session-bypass-utility.js` - Core session generation and API submission
- `test-data-generator.js` - Controlled rating dataset generation

### Features:
- Unique session ID generation with timestamp and random components
- Batch session creation for concurrent testing
- Session pool management for stress testing
- Automatic cleanup utilities for test data removal

## Test Data Generation

The suite includes advanced test data generation capabilities:

### Distribution Types:
- **Uniform**: Evenly distributed ratings across a range
- **Normal**: Bell curve distribution with configurable mean and standard deviation
- **Targeted**: Focused distribution within specific ranges
- **Pattern-based**: Predefined patterns for specific test cases

### Pattern Examples:
```javascript
// Category-specific patterns
generator.generatePattern('smoke_show', 15);  // High ratings (8.5-10.0)
generator.generatePattern('dregs', 15);       // Low ratings (0.0-2.0)
generator.generatePattern('mixed_polarized'); // Highly polarized ratings

// Boundary testing patterns
generator.generatePattern('threshold_test');  // Exact category boundaries
generator.generatePattern('precision_test');  // High decimal precision
```

## Performance Metrics

The stress testing component provides detailed performance analytics:

### Metrics Collected:
- **Operations per second**: Throughput measurement
- **Response times**: Min, max, average, median, 95th, 99th percentile
- **Success rates**: Percentage of successful operations
- **Error tracking**: Detailed error categorization
- **Database consistency**: Verification of data integrity under load

### Sample Output:
```
📊 Stress Test Results:
   Successful: 47/50 (94.0%)
   Total Time: 8,234ms
   Avg Response: 165ms
   Operations/sec: 6.1
   95th percentile: 287ms
```

## Report Generation

The test suite generates comprehensive JSON reports including:

- Overall test summary with success rates
- Component-level results breakdown
- Performance metrics and insights
- Failed test details with error messages
- Environment information
- Execution timestamps and duration

Reports are saved to: `/root/ratemyfeet/test-reports/rating-suite-{timestamp}.json`

## Safety Features

### Data Protection:
- All test data uses identifiable session prefixes (`test_*`)
- Automatic cleanup removes only test-generated data
- Optional cleanup preservation for debugging
- Database integrity verification before and after tests

### Error Handling:
- Graceful component failure handling
- Comprehensive error reporting
- System readiness validation
- Safe session ID generation with collision avoidance

## Usage Examples

### Development Validation
```bash
# Quick validation during development
node scripts/rating-test-suite.js --basic-only
```

### Pre-deployment Testing
```bash
# Full suite with performance validation
node scripts/rating-test-suite.js
```

### Debugging Issues
```bash
# Run specific component with preserved data
node scripts/median-calculation-validator.js
# Inspect results, then cleanup manually if needed
```

### Performance Benchmarking
```bash
# Focus on stress testing
node scripts/stress-test-runner.js
```

## Exit Codes

- `0`: All tests passed successfully
- `1`: One or more tests failed or suite crashed

## Troubleshooting

### Common Issues:

1. **"No test images available"**
   - Ensure at least 5 images exist in the database
   - Check Supabase connection and table access

2. **"Missing Supabase environment variables"**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - Check environment variable format and accessibility

3. **Performance test failures**
   - May indicate system under load or network issues
   - Adjust concurrency limits in stress test configuration

4. **Category transition test failures**
   - Requires both rated and unrated images
   - May need existing ratings in various categories

### Debug Mode:
Individual components can be run directly for detailed debugging and inspection of specific functionality.

## Contributing

When adding new tests:
1. Follow the existing pattern of test result logging
2. Include cleanup functionality for any test data
3. Add comprehensive error handling
4. Update this README with new test descriptions