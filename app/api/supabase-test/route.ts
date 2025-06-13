import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client with env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
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
    
    // Test storage bucket access
    const { data: bucketData, error: bucketError } = await supabase.storage.listBuckets();
    
    const bucketList = bucketData?.map(bucket => bucket.name) || [];
    const imagesBucketExists = bucketList.includes('images');
    
    let imagesPublicFolderExists = false;
    let entriesTableAccessible = false;
    
    // Only check the public folder if the images bucket exists
    if (imagesBucketExists) {
      const { data: folderData, error: folderError } = await supabase.storage
        .from('images')
        .list('public', { limit: 1 });
      
      imagesPublicFolderExists = !folderError;
    }
    
    // Test database access to entries table
    const { data: entriesData, error: entriesError } = await supabase
      .from('entries')
      .select('id')
      .limit(1);
    
    entriesTableAccessible = !entriesError;
    
    return NextResponse.json({
      status: 'success',
      supabase_connected: true,
      buckets: {
        list: bucketList,
        images_bucket_exists: imagesBucketExists,
        images_public_folder_exists: imagesPublicFolderExists
      },
      database: {
        entries_table_accessible: entriesTableAccessible,
        entries_error: entriesError ? entriesError.message : null
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}