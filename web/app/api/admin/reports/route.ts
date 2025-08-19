import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple password check for admin access
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ratemyfeet2025';

interface UpdateReportRequest {
  imageId: string;
  action: 'approve' | 'hide';
  moderatorId: string;
}

// GET: Fetch all pending reports for admin review
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

    // Use the database function to get flagged images with report details
    const { data: flaggedImages, error: fetchError } = await supabase
      .rpc('get_flagged_images', { limit_count: 100 });

    if (fetchError) {
      console.error('Error fetching flagged images:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch flagged images' },
        { status: 500 }
      );
    }

    // Also get some general stats
    const { data: reportStats, error: statsError } = await supabase
      .from('reports')
      .select('status')
      .then(result => {
        if (result.error) return { data: null, error: result.error };
        
        const stats = result.data.reduce((acc: any, report: any) => {
          acc[report.status] = (acc[report.status] || 0) + 1;
          return acc;
        }, {});
        
        return { data: stats, error: null };
      });

    if (statsError) {
      console.error('Error fetching report stats:', statsError);
      // Continue without stats
    }

    return NextResponse.json({
      success: true,
      flaggedImages: flaggedImages || [],
      stats: reportStats || { pending: 0, reviewed: 0, dismissed: 0 },
      totalFlagged: (flaggedImages || []).length
    });

  } catch (error) {
    console.error('Unexpected error in admin reports GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Update report status and image moderation status
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
    const body: UpdateReportRequest = await request.json();
    const { imageId, action, moderatorId } = body;

    // Validation
    if (!imageId || !action || !moderatorId) {
      return NextResponse.json(
        { error: 'Missing required fields: imageId, action, moderatorId' },
        { status: 400 }
      );
    }

    if (!['approve', 'hide'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "hide"' },
        { status: 400 }
      );
    }

    // Check if image exists
    const { data: imageExists, error: imageError } = await supabase
      .from('images')
      .select('id, moderation_status, report_count')
      .eq('id', imageId)
      .single();

    if (imageError || !imageExists) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Determine the new moderation status
    const newStatus = action === 'approve' ? 'approved' : 'hidden';

    // Use the database function to update moderation status
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_moderation_status', {
        image_id_param: imageId,
        new_status: newStatus,
        moderator_id: moderatorId
      });

    if (updateError) {
      console.error('Error updating moderation status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update moderation status' },
        { status: 500 }
      );
    }

    if (!updateResult) {
      return NextResponse.json(
        { error: 'Image not found or update failed' },
        { status: 404 }
      );
    }

    // Get updated image info
    const { data: updatedImage, error: fetchUpdatedError } = await supabase
      .from('images')
      .select('id, moderation_status, moderated_at, moderated_by, report_count')
      .eq('id', imageId)
      .single();

    if (fetchUpdatedError) {
      console.error('Error fetching updated image:', fetchUpdatedError);
      // Continue anyway, the update was successful
    }

    return NextResponse.json({
      success: true,
      action: action,
      imageId: imageId,
      newStatus: newStatus,
      moderatedBy: moderatorId,
      moderatedAt: updatedImage?.moderated_at,
      message: `Image has been ${action === 'approve' ? 'approved' : 'hidden'} successfully.`
    });

  } catch (error) {
    console.error('Unexpected error in admin reports POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch reports or POST to update them.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch reports or POST to update them.' },
    { status: 405 }
  );
}