// Test script to verify rating update functionality with JavaScript fallback
// Run with: node scripts/test-rating-update.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple median calculation function (mirrors the utils function)
function calculateMedian(ratings) {
  if (!ratings || ratings.length === 0) return 0;
  
  const sortedRatings = [...ratings].sort((a, b) => a - b);
  const length = sortedRatings.length;
  const mid = Math.floor(length / 2);
  
  const median = length % 2 !== 0
    ? sortedRatings[mid]
    : (sortedRatings[mid - 1] + sortedRatings[mid]) / 2;
    
  return Math.round(median * 100) / 100;
}

async function testJavaScriptRatingUpdate() {
  try {
    console.log('🧪 Testing JavaScript rating update functionality...\n');

    // Get the first image for testing
    const { data: images, error: imageError } = await supabase
      .from('images')
      .select('id, username, rating_count, median_score')
      .limit(1);

    if (imageError || !images || images.length === 0) {
      console.error('❌ Error fetching test image:', imageError);
      return;
    }

    const testImage = images[0];
    console.log('📷 Testing with image:', {
      id: testImage.id,
      username: testImage.username,
      currentRatingCount: testImage.rating_count,
      currentMedianScore: testImage.median_score
    });

    // Test JavaScript-based calculation (like the API now uses)
    console.log('\n🔄 Testing JavaScript median calculation...');
    
    // Fetch all ratings for this image
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('rating')
      .eq('image_id', testImage.id)
      .order('rating', { ascending: true });

    if (ratingsError) {
      console.error('❌ Error fetching ratings:', ratingsError);
      return;
    }

    const ratingValues = ratings ? ratings.map(r => r.rating) : [];
    const calculatedMedian = calculateMedian(ratingValues);
    const calculatedCount = ratingValues.length;

    console.log('📊 JavaScript calculation results:', {
      ratings_found: calculatedCount,
      calculated_median: calculatedMedian,
      rating_values: ratingValues
    });

    // Test updating the database (like the API does)
    console.log('\n💾 Testing database update...');
    const { error: updateError } = await supabase
      .from('images')
      .update({
        median_score: calculatedMedian,
        rating_count: calculatedCount,
      })
      .eq('id', testImage.id);

    if (updateError) {
      console.error('❌ Error updating image:', updateError);
      return;
    }

    console.log('✅ Database update successful');

    // Verify the update
    const { data: updatedImage, error: fetchError } = await supabase
      .from('images')
      .select('rating_count, median_score')
      .eq('id', testImage.id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching updated stats:', fetchError);
      return;
    }

    console.log('📈 Verified updated statistics:', {
      rating_count: updatedImage.rating_count,
      median_score: updatedImage.median_score,
      matches_calculation: updatedImage.rating_count === calculatedCount && 
                          updatedImage.median_score === calculatedMedian
    });

    console.log('\n✅ JavaScript rating update test completed successfully!');
    console.log('🎯 The API should now work correctly without database functions');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testDatabaseFunctions() {
  console.log('\n🔧 Testing if database functions exist...');
  
  try {
    const { data, error } = await supabase.rpc('update_image_stats', {
      target_image_id: '00000000-0000-0000-0000-000000000000' // Dummy UUID
    });
    
    if (error && error.code === 'PGRST202') {
      console.log('❌ Database functions not found (expected - using JavaScript fallback)');
      return false;
    } else {
      console.log('✅ Database functions are available');
      return true;
    }
  } catch (error) {
    console.log('❌ Database functions not available:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting rating system tests...\n');
  
  const functionsExist = await testDatabaseFunctions();
  
  if (!functionsExist) {
    console.log('\n📝 Note: Database functions not found. Testing JavaScript fallback approach.');
    console.log('   To add database functions, run the SQL script: scripts/apply-migrations.sql\n');
  }
  
  await testJavaScriptRatingUpdate();
}

runTests();