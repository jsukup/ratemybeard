import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Rate limiting: 50 ratings per day per IP
const DAILY_RATING_LIMIT = 50;

interface RatingSubmission {
  imageId: string;
  rating: number;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RatingSubmission = await request.json();
    const { imageId, rating } = body;

    // Get session ID and IP address from headers
    const sessionId = request.headers.get('x-session-id');
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.ip || 
                     'unknown';

    // Validation: Check required fields
    if (!imageId || rating === undefined || rating === null) {
      return NextResponse.json(
        { error: 'Missing required fields: imageId and rating' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required. Please ensure cookies are enabled.' },
        { status: 400 }
      );
    }

    // Validation: Check rating range (0.00 to 10.00)
    const numericRating = parseFloat(rating.toString());
    if (isNaN(numericRating) || numericRating < 0 || numericRating > 10) {
      return NextResponse.json(
        { error: 'Rating must be between 0.00 and 10.00' },
        { status: 400 }
      );
    }

    // Round rating to 2 decimal places
    const finalRating = Math.round(numericRating * 100) / 100;

    // Check if image exists
    const { data: imageExists, error: imageError } = await supabase
      .from('images')
      .select('id')
      .eq('id', imageId)
      .single();

    if (imageError || !imageExists) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Check for duplicate rating (same session + image)
    const { data: existingRating, error: duplicateError } = await supabase
      .from('ratings')
      .select('id')
      .eq('image_id', imageId)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (duplicateError) {
      console.error('Error checking for duplicate rating:', duplicateError);
      return NextResponse.json(
        { error: 'Database error during duplicate check' },
        { status: 500 }
      );
    }

    if (existingRating) {
      return NextResponse.json(
        { error: 'You have already rated this image' },
        { status: 409 }
      );
    }

    // Check daily rate limit for IP address (if IP is available)
    if (ipAddress && ipAddress !== 'unknown') {
      // Calculate start of current day for more efficient querying
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const { data: dailyRatings, error: rateLimitError } = await supabase
        .from('ratings')
        .select('id')
        .eq('ip_address', ipAddress)
        .gte('created_at', startOfDay.toISOString());

      if (rateLimitError) {
        console.error('Error checking rate limit:', rateLimitError);
        // Continue anyway - rate limiting is not critical
      } else if (dailyRatings && dailyRatings.length >= DAILY_RATING_LIMIT) {
        return NextResponse.json(
          { error: `Daily rating limit exceeded (${DAILY_RATING_LIMIT} ratings per day)` },
          { status: 429 }
        );
      }
    }

    // Insert the rating
    const { data: insertedRating, error: insertError } = await supabase
      .from('ratings')
      .insert({
        image_id: imageId,
        rating: finalRating,
        session_id: sessionId,
        ip_address: ipAddress !== 'unknown' ? ipAddress : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting rating:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit rating' },
        { status: 500 }
      );
    }

    // Update image statistics with proper error handling
    let statsUpdateSuccess = false;
    try {
      await updateImageStatistics(imageId);
      statsUpdateSuccess = true;
    } catch (statsError) {
      console.error('Error updating image statistics:', statsError);
      // Log the error but don't fail the rating submission
      // The user will still see their rating was accepted
    }

    // Return success response with statistics update status
    return NextResponse.json({
      success: true,
      rating: {
        id: insertedRating.id,
        rating: finalRating,
        imageId: imageId,
        createdAt: insertedRating.created_at,
      },
      statsUpdated: statsUpdateSuccess,
      message: statsUpdateSuccess 
        ? 'Rating submitted and leaderboard updated successfully!' 
        : 'Rating submitted successfully! Leaderboard will update shortly.',
    });

  } catch (error) {
    console.error('Unexpected error in rating submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to manually update image statistics
async function updateImageStatistics(imageId: string) {
  try {
    // Call the database function we created in Task 2
    const { error } = await supabase.rpc('update_image_stats', {
      target_image_id: imageId
    });

    if (error) {
      console.error('Error calling update_image_stats function:', error);
      throw new Error(`Database function failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in updateImageStatistics:', error);
    throw error; // Re-throw to be caught by calling function
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit ratings.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit ratings.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit ratings.' },
    { status: 405 }
  );
}