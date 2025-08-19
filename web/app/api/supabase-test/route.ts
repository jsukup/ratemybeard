import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client with env vars (cleaned to remove whitespace/newlines)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\s+/g, '');
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().replace(/\s+/g, '');
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Supabase environment variables are not configured',
        env_vars_present: {
          url: !!supabaseUrl,
          key: !!supabaseKey
        }
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test storage bucket access directly (don't rely on listBuckets which needs admin permissions)
    let imagesBucketExists = false;
    let storageAccessTest = false;
    let bucketError = null;
    
    // Test images bucket directly by trying to list its contents
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('images')
        .list('', { limit: 1 });
      
      if (!listError) {
        imagesBucketExists = true;
        storageAccessTest = true;
      } else {
        bucketError = listError.message;
      }
    } catch (e) {
      bucketError = e instanceof Error ? e.message : 'Unknown storage error';
    }
    
    let imagesTableAccessible = false;
    let ratingsTableAccessible = false;
    
    // Test database access to images table
    const { data: imagesData, error: imagesError } = await supabase
      .from('images')
      .select('id')
      .limit(1);
    
    imagesTableAccessible = !imagesError;
    
    // Test database access to ratings table
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('ratings')
      .select('id')
      .limit(1);
    
    ratingsTableAccessible = !ratingsError;
    
    return NextResponse.json({
      status: 'success',
      supabase_connected: true,
      storage: {
        images_bucket_exists: imagesBucketExists,
        storage_access_test: storageAccessTest,
        bucket_error: bucketError
      },
      database: {
        images_table_accessible: imagesTableAccessible,
        ratings_table_accessible: ratingsTableAccessible,
        images_error: imagesError ? imagesError.message : null,
        ratings_error: ratingsError ? ratingsError.message : null
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}