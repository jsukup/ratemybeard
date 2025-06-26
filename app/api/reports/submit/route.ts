import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Rate limiting: 10 reports per day per IP
const DAILY_REPORT_LIMIT = 10;

interface ReportSubmission {
  imageId: string;
  reportReason: 'not_feet' | 'inappropriate' | 'spam_fake' | 'other';
  reportDetails?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ReportSubmission = await request.json();
    const { imageId, reportReason, reportDetails } = body;

    // Get session ID and IP address from headers
    const sessionId = request.headers.get('x-session-id');
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.ip || 
                     'unknown';

    // Validation: Check required fields
    if (!imageId || !reportReason) {
      return NextResponse.json(
        { error: 'Missing required fields: imageId and reportReason' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required. Please ensure cookies are enabled.' },
        { status: 400 }
      );
    }

    // Validation: Check report reason
    const validReasons = ['not_feet', 'inappropriate', 'spam_fake', 'other'];
    if (!validReasons.includes(reportReason)) {
      return NextResponse.json(
        { error: 'Invalid report reason. Must be one of: ' + validReasons.join(', ') },
        { status: 400 }
      );
    }

    // Validation: Check report details length if provided
    if (reportDetails && reportDetails.length > 500) {
      return NextResponse.json(
        { error: 'Report details must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Check if image exists and is visible
    const { data: imageExists, error: imageError } = await supabase
      .from('images')
      .select('id, moderation_status')
      .eq('id', imageId)
      .single();

    if (imageError || !imageExists) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Don't allow reports on already hidden images
    if (imageExists.moderation_status === 'hidden') {
      return NextResponse.json(
        { error: 'This image is no longer available for reporting' },
        { status: 410 }
      );
    }

    // Check for duplicate report (same session + image)
    const { data: existingReport, error: duplicateError } = await supabase
      .from('reports')
      .select('id')
      .eq('image_id', imageId)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (duplicateError) {
      console.error('Error checking for duplicate report:', duplicateError);
      return NextResponse.json(
        { error: 'Database error during duplicate check' },
        { status: 500 }
      );
    }

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this image' },
        { status: 409 }
      );
    }

    // Check daily rate limit for IP address (if IP is available)
    if (ipAddress && ipAddress !== 'unknown') {
      // Calculate start of current day
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const { data: dailyReports, error: rateLimitError } = await supabase
        .from('reports')
        .select('id')
        .eq('ip_address', ipAddress)
        .gte('created_at', startOfDay.toISOString());

      if (rateLimitError) {
        console.error('Error checking rate limit:', rateLimitError);
        // Continue anyway - rate limiting is not critical
      } else if (dailyReports && dailyReports.length >= DAILY_REPORT_LIMIT) {
        return NextResponse.json(
          { error: `Daily report limit exceeded (${DAILY_REPORT_LIMIT} reports per day)` },
          { status: 429 }
        );
      }
    }

    // Insert the report
    const { data: insertedReport, error: insertError } = await supabase
      .from('reports')
      .insert({
        image_id: imageId,
        session_id: sessionId,
        ip_address: ipAddress !== 'unknown' ? ipAddress : null,
        report_reason: reportReason,
        report_details: reportDetails || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting report:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      );
    }

    // Get updated image info to check if it was automatically flagged
    const { data: updatedImage, error: imageUpdateError } = await supabase
      .from('images')
      .select('id, report_count, moderation_status')
      .eq('id', imageId)
      .single();

    if (imageUpdateError) {
      console.error('Error fetching updated image info:', imageUpdateError);
      // Report was submitted successfully, just can't get updated info
    }

    // Return success response
    return NextResponse.json({
      success: true,
      report: {
        id: insertedReport.id,
        imageId: imageId,
        reportReason: reportReason,
        createdAt: insertedReport.created_at,
      },
      imageStatus: updatedImage ? {
        reportCount: updatedImage.report_count,
        moderationStatus: updatedImage.moderation_status,
        wasAutoFlagged: updatedImage.moderation_status === 'flagged'
      } : null,
      message: 'Report submitted successfully. Thank you for helping keep our community safe.',
    });

  } catch (error) {
    console.error('Unexpected error in report submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit reports.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit reports.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit reports.' },
    { status: 405 }
  );
}