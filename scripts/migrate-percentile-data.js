#!/usr/bin/env node

/**
 * Data Migration Script for Percentile Calculation Fix
 * 
 * This script recalculates all median scores and percentile rankings
 * after fixing the inverted percentile logic bug.
 */

const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

// Load environment variables
config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Calculate median from an array of numbers
 */
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

/**
 * Fetch all ratings for a specific image
 */
async function fetchImageRatings(imageId) {
  try {
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('image_id', imageId)
      .order('rating', { ascending: true });

    if (error) {
      console.error(`Error fetching ratings for image ${imageId}:`, error);
      return [];
    }

    return ratings ? ratings.map(r => r.rating) : [];
  } catch (error) {
    console.error(`Error in fetchImageRatings for ${imageId}:`, error);
    return [];
  }
}

/**
 * Update median score for a specific image
 */
async function updateImageMedianScore(imageId) {
  try {
    const ratings = await fetchImageRatings(imageId);
    const median = calculateMedian(ratings);
    const count = ratings.length;
    
    const { error: updateError } = await supabase
      .from('images')
      .update({
        median_score: median,
        rating_count: count,
        updated_at: new Date().toISOString(),
      })
      .eq('id', imageId);

    if (updateError) {
      throw updateError;
    }

    return { median, count };
  } catch (error) {
    console.error(`Error updating image ${imageId}:`, error);
    throw error;
  }
}

/**
 * Get all images that need migration
 */
async function getImagesToMigrate() {
  try {
    const { data: images, error } = await supabase
      .from('images')
      .select('id, username, median_score, rating_count')
      .eq('is_visible', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return images || [];
  } catch (error) {
    console.error('Error fetching images to migrate:', error);
    throw error;
  }
}

/**
 * Create a backup of current data
 */
async function createBackup() {
  console.log('📦 Creating backup of current image data...');
  
  try {
    const { data: images, error } = await supabase
      .from('images')
      .select('*');

    if (error) {
      throw error;
    }

    const backupData = {
      timestamp: new Date().toISOString(),
      totalImages: images.length,
      data: images
    };

    // Save backup to a JSON file
    const fs = require('fs');
    const backupFileName = `backup-images-${Date.now()}.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup created: ${backupFileName}`);
    console.log(`📊 Backed up ${images.length} images`);
    
    return backupFileName;
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting Percentile Data Migration');
  console.log('=====================================');
  
  try {
    // Step 1: Create backup
    const backupFile = await createBackup();
    
    // Step 2: Get all images to migrate
    console.log('\n📊 Fetching images to migrate...');
    const images = await getImagesToMigrate();
    console.log(`Found ${images.length} images to process`);
    
    if (images.length === 0) {
      console.log('✅ No images need migration');
      return;
    }
    
    // Step 3: Process each image
    console.log('\n🔄 Starting migration process...');
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        const result = await updateImageMedianScore(image.id);
        successCount++;
        
        if (i % 10 === 0 || i === images.length - 1) {
          console.log(`Progress: ${i + 1}/${images.length} (${Math.round((i + 1) / images.length * 100)}%)`);
        }
        
        // Add small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        errorCount++;
        errors.push({
          imageId: image.id,
          username: image.username,
          error: error.message
        });
        
        console.error(`❌ Failed to update image ${image.id} (${image.username}):`, error.message);
      }
    }
    
    // Step 4: Summary
    console.log('\n📈 Migration Summary');
    console.log('===================');
    console.log(`✅ Successfully updated: ${successCount} images`);
    console.log(`❌ Failed to update: ${errorCount} images`);
    console.log(`📦 Backup file: ${backupFile}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(err => {
        console.log(`  - Image ${err.imageId} (${err.username}): ${err.error}`);
      });
    }
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log(`\n⚠️  Migration completed with ${errorCount} errors`);
      console.log('Please review the errors above and consider re-running for failed images');
    }
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    console.error('Please check your database connection and environment variables');
    process.exit(1);
  }
}

/**
 * Validate database connection
 */
async function validateConnection() {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('count')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Validating database connection...');
  
  const connectionValid = await validateConnection();
  if (!connectionValid) {
    console.error('💥 Cannot proceed without valid database connection');
    process.exit(1);
  }
  
  // Ask for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\n⚠️  This will recalculate median scores for all images. Continue? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      rl.close();
      runMigration().catch(console.error);
    } else {
      console.log('Migration cancelled');
      rl.close();
    }
  });
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runMigration,
  createBackup,
  updateImageMedianScore,
  calculateMedian
};