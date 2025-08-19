import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { updateImageMedianScore } from '@/utils/medianCalculation';

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

    // Check if using discrete ratings (feature flag)
    const useDiscreteRatings = process.env.NEXT_PUBLIC_ENABLE_DISCRETE_RATINGS === 'true';
    
    // Validation: Check rating range based on mode
    const numericRating = parseFloat(rating.toString());
    
    if (isNaN(numericRating)) {
      return NextResponse.json(
        { error: 'Rating must be a valid number' },
        { status: 400 }
      );
    }
    
    let finalRating: number;
    
    if (useDiscreteRatings) {
      // Discrete mode: Accept integers 1-10 only
      if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 10) {
        return NextResponse.json(
          { error: 'Rating must be an integer between 1 and 10' },
          { status: 400 }
        );
      }
      // Store discrete ratings as X.00 format (1.00, 2.00, etc.)
      finalRating = numericRating;
    } else {
      // Legacy mode: Accept decimals 0.00-10.00
      if (numericRating < 0 || numericRating > 10) {
        return NextResponse.json(
          { error: 'Rating must be between 0.00 and 10.00' },
          { status: 400 }
        );
      }
      // Round legacy ratings to 2 decimal places
      finalRating = Math.round(numericRating * 100) / 100;
    }

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

    // Update image statistics using JavaScript utility function
    let statsUpdateSuccess = false;
    let updatedStats = null;
    try {
      console.log(`Updating statistics for image ${imageId}...`);
      const result = await updateImageMedianScore(imageId);
      if (result) {
        updatedStats = {
          median_score: result.median,
          rating_count: result.count
        };
        statsUpdateSuccess = true;
        console.log(`Statistics updated successfully:`, updatedStats);
      } else {
        throw new Error('updateImageMedianScore returned null');
      }
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
      updatedStats: updatedStats,
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

// Note: Using JavaScript utility function updateImageMedianScore from utils/medianCalculation.ts
// instead of database function due to missing database migrations

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