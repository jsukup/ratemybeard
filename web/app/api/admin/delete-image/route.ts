import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple password check for admin access
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ratemyfeet2025';

interface DeleteImageRequest {
  imageId: string;
  moderatorId: string;
  confirmDelete?: boolean;
}

interface DeleteResult {
  success: boolean;
  image_id: string;
  username?: string;
  image_url?: string;
  records_deleted?: {
    ratings: number;
    reports: number;
    image: number;
  };
  total_records_deleted?: number;
  storage_deleted?: boolean;
  moderator_id?: string;
  deleted_at?: string;
  error?: string;
}

// POST: Permanently delete an image and all related data
export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const password = request.headers.get('x-admin-password');
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid admin password.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: DeleteImageRequest = await request.json();
    const { imageId, moderatorId, confirmDelete } = body;

    // Validation
    if (!imageId || !moderatorId) {
      return NextResponse.json(
        { error: 'Missing required fields: imageId, moderatorId' },
        { status: 400 }
      );
    }

    // Safety check - require explicit confirmation
    if (!confirmDelete) {
      return NextResponse.json(
        { error: 'Deletion must be explicitly confirmed with confirmDelete: true' },
        { status: 400 }
      );
    }

    // First, get image details for storage deletion
    const { data: imageData, error: imageError } = await supabase
      .from('images')
      .select('id, username, image_url, image_name, report_count, moderation_status')
      .eq('id', imageId)
      .single();

    if (imageError || !imageData) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Extract storage path from image_url or use image_name
    let storagePath: string | null = null;
    if (imageData.image_name) {
      storagePath = `public/${imageData.image_name}`;
    } else if (imageData.image_url && imageData.image_url.includes('/storage/v1/object/public/images/')) {
      // Extract path from full URL
      const urlParts = imageData.image_url.split('/storage/v1/object/public/images/');
      if (urlParts.length > 1) {
        storagePath = urlParts[1];
      }
    }

    // Call the database function to delete all records
    const { data: deleteResult, error: deleteError } = await supabase
      .rpc('delete_image_completely', {
        image_id_param: imageId,
        moderator_id: moderatorId
      });

    if (deleteError) {
      console.error('Error deleting image from database:', deleteError);
      return NextResponse.json(
        { error: `Database deletion failed: ${deleteError.message}` },
        { status: 500 }
      );
    }

    if (!deleteResult || !deleteResult.success) {
      return NextResponse.json(
        { 
          error: deleteResult?.error || 'Database deletion failed',
          details: deleteResult 
        },
        { status: 500 }
      );
    }

    // Attempt to delete from storage if we have a storage path
    let storageDeleted = false;
    let storageError: string | null = null;

    if (storagePath) {
      try {
        const { error: storageDeleteError } = await supabase.storage
          .from('images')
          .remove([storagePath]);

        if (storageDeleteError) {
          console.error('Storage deletion error:', storageDeleteError);
          storageError = storageDeleteError.message;
          // Don't fail the entire operation if storage deletion fails
          // The database records are already deleted
        } else {
          storageDeleted = true;
        }
      } catch (error) {
        console.error('Storage deletion exception:', error);
        storageError = error instanceof Error ? error.message : 'Unknown storage error';
      }
    } else {
      storageError = 'Could not determine storage path from image data';
    }

    // Prepare the response
    const result: DeleteResult = {
      ...deleteResult,
      storage_deleted: storageDeleted,
      storage_error: storageError || undefined
    };

    // Log the deletion for monitoring
    console.log(`Image ${imageId} permanently deleted by ${moderatorId}:`, {
      username: deleteResult.username,
      records_deleted: deleteResult.records_deleted,
      storage_deleted: storageDeleted,
      storage_path: storagePath
    });

    return NextResponse.json({
      success: true,
      message: 'Image and all related data permanently deleted',
      result: result,
      warnings: storageError ? [`Storage deletion issue: ${storageError}`] : undefined
    });

  } catch (error) {
    console.error('Unexpected error in delete image:', error);
    return NextResponse.json(
      { error: 'Internal server error during deletion' },
      { status: 500 }
    );
  }
}

// GET: Get deletion statistics (for admin monitoring)
export async function GET(request: NextRequest) {
  try {
    // Check admin password
    const password = request.headers.get('x-admin-password');
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid admin password.' },
        { status: 401 }
      );
    }

    // Get optional days parameter
    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Invalid days parameter. Must be between 1 and 365.' },
        { status: 400 }
      );
    }

    // Get deletion statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_deletion_stats', { days_back: days });

    if (statsError) {
      console.error('Error fetching deletion stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch deletion statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stats: stats || {
        period_days: days,
        total_deletions: 0,
        deletions_by_moderator: {},
        deletions_by_day: {}
      }
    });

  } catch (error) {
    console.error('Unexpected error fetching deletion stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to delete images or GET to fetch deletion stats.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to delete images or GET to fetch deletion stats.' },
    { status: 405 }
  );
}