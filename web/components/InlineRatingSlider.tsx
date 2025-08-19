'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AlertCircle, Star, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getOrCreateSessionId } from '@/lib/session';
import { RatingButtonsGrid } from '@/components/RatingButtonsGrid';

interface InlineRatingSliderProps {
  imageId: string;
  disabled?: boolean;
  onRatingSubmit?: (rating: number, updatedStats?: { median_score: number; rating_count: number }) => void;
  className?: string;
}

export function InlineRatingSlider({ 
  imageId, 
  disabled = false, 
  onRatingSubmit,
  className = "" 
}: InlineRatingSliderProps) {
  // Feature flag for discrete ratings
  const useDiscreteRatings = process.env.NEXT_PUBLIC_ENABLE_DISCRETE_RATINGS === 'true';
  
  // Legacy slider state
  const [rating, setRating] = useState<number[]>([5.0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentRating = rating[0];

  const handleRatingChange = (newRating: number[]) => {
    if (disabled || isSubmitting || success) return;
    setRating(newRating);
    setError(null);
  };

  const handleSubmit = async () => {
    if (disabled || isSubmitting || success) return;

    console.log('Starting rating submission for image:', imageId, 'with rating:', currentRating);
    setIsSubmitting(true);
    setError(null);

    try {
      // Get or create session ID
      const sessionId = getOrCreateSessionId();
      console.log('Using session ID:', sessionId);

      // Validate sessionId before using it in headers
      if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
        throw new Error('Invalid session ID');
      }

      const response = await fetch('/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId.trim(),
        },
        body: JSON.stringify({
          imageId: imageId,
          rating: currentRating,
        }),
      });

      console.log('API response status:', response.status, response.ok);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to submit rating');
      }

      const result = await response.json();
      console.log('Rating submission successful:', result);
      
      setSuccess(true);
      
      // Call the callback after a short delay to ensure state is updated
      setTimeout(() => {
        console.log('Calling onRatingSubmit callback with updated stats:', result.updatedStats);
        onRatingSubmit?.(currentRating, result.updatedStats);
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle rating submission for discrete buttons
  const handleDiscreteRatingSubmit = (rating: number, updatedStats?: { median_score: number; rating_count: number }) => {
    // Call the callback immediately since RatingButtonsGrid handles the API call
    onRatingSubmit?.(rating, updatedStats);
  };

  // Use new discrete rating system if feature flag is enabled
  if (useDiscreteRatings) {
    return (
      <div className={className}>
        <RatingButtonsGrid
          imageId={imageId}
          onSubmit={handleDiscreteRatingSubmit}
          disabled={disabled}
          compact={true}
        />
      </div>
    );
  }

  // Legacy inline slider implementation
  if (success) {
    return (
      <div className={`flex items-center justify-center text-sm text-green-600 ${className}`}>
        <Star className="h-4 w-4 mr-1" />
        Rated {currentRating.toFixed(2)}
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {/* Rating Display */}
      <div className="text-center">
        <span className="text-sm font-medium">
          {currentRating.toFixed(2)}
        </span>
      </div>

      {/* Slider */}
      <div className="px-2">
        <Slider
          value={rating}
          onValueChange={handleRatingChange}
          max={10}
          min={0}
          step={0.01}
          disabled={disabled || isSubmitting}
          className="w-full"
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={disabled || isSubmitting}
        size="sm"
        className="h-8 text-xs"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit'
        )}
      </Button>

      {/* Error Display */}
      {error && (
        <div className="text-xs text-red-600 text-center">
          {error}
        </div>
      )}
    </div>
  );
}