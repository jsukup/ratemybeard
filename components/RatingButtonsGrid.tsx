"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Star, Loader2 } from "lucide-react";
import { getOrCreateSessionId } from '@/lib/session';

interface RatingButtonsGridProps {
  imageId: string;
  onSubmit: (rating: number) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean; // For inline/table usage
}

export function RatingButtonsGrid({ 
  imageId, 
  onSubmit, 
  disabled = false, 
  className = "",
  compact = false 
}: RatingButtonsGridProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Color mapping for ratings 1-10
  const getRatingColor = (rating: number): string => {
    if (rating <= 2) return "bg-red-500 hover:bg-red-600 text-white";
    if (rating <= 4) return "bg-orange-500 hover:bg-orange-600 text-white";
    if (rating <= 6) return "bg-yellow-500 hover:bg-yellow-600 text-white";
    if (rating <= 8) return "bg-green-500 hover:bg-green-600 text-white";
    return "bg-amber-400 hover:bg-amber-500 text-white";
  };

  const getRatingDescription = (rating: number): string => {
    const descriptions = {
      1: "Awful",
      2: "Poor", 
      3: "Not great",
      4: "Below average",
      5: "Average",
      6: "Decent", 
      7: "Good",
      8: "Very good",
      9: "Excellent",
      10: "Perfect"
    };
    return descriptions[rating as keyof typeof descriptions] || "";
  };

  const handleRatingClick = async (rating: number) => {
    if (disabled || isSubmitting || success) return;

    setSelectedRating(rating);
    setIsSubmitting(true);
    setError(null);

    try {
      // Get or create session ID
      const sessionId = getOrCreateSessionId();
      
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
          rating: rating, // Send discrete integer
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit rating');
      }

      const result = await response.json();
      
      setSuccess(true);
      onSubmit(rating);
    } catch (err) {
      console.error('Error submitting rating:', err);
      
      let errorMessage = 'Failed to submit rating. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('Already rated')) {
          errorMessage = 'You have already rated this image.';
        } else if (err.message.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setSelectedRating(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'text-sm' : ''} text-green-600 ${className}`}>
        <Star className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} mr-2`} />
        <span>Rated {selectedRating}/10</span>
      </div>
    );
  }

  const buttonSize = compact ? 'h-8 w-8 text-xs' : 'h-12 w-12 text-sm';
  const gridGap = compact ? 'gap-1' : 'gap-2';
  const containerClass = compact ? 'p-2' : 'p-4';

  return (
    <div className={`${containerClass} ${className}`}>
      {/* Rating Description */}
      {!compact && selectedRating && (
        <div className="text-center mb-4">
          <div className="text-lg font-medium text-gray-700">
            {getRatingDescription(selectedRating)}
          </div>
          <div className="text-2xl font-bold text-primary">
            {selectedRating}/10
          </div>
        </div>
      )}

      {/* Rating Grid */}
      <div className={`grid grid-cols-5 ${gridGap} mb-4`}>
        {/* Top Row: 1-5 */}
        {[1, 2, 3, 4, 5].map((rating) => (
          <Button
            key={rating}
            onClick={() => handleRatingClick(rating)}
            disabled={disabled || isSubmitting}
            className={`
              ${buttonSize} 
              ${getRatingColor(rating)}
              ${selectedRating === rating ? 'ring-2 ring-offset-2 ring-primary' : ''}
              ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}
              transition-all duration-200 font-bold
            `}
            variant="secondary"
          >
            {isSubmitting && selectedRating === rating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              rating
            )}
          </Button>
        ))}
        {/* Bottom Row: 6-10 */}
        {[6, 7, 8, 9, 10].map((rating) => (
          <Button
            key={rating}
            onClick={() => handleRatingClick(rating)}
            disabled={disabled || isSubmitting}
            className={`
              ${buttonSize} 
              ${getRatingColor(rating)}
              ${selectedRating === rating ? 'ring-2 ring-offset-2 ring-primary' : ''}
              ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}
              transition-all duration-200 font-bold
            `}
            variant="secondary"
          >
            {isSubmitting && selectedRating === rating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              rating
            )}
          </Button>
        ))}
      </div>

      {/* Helper Text */}
      {!compact && !error && (
        <p className="text-xs text-muted-foreground text-center">
          Click a number to rate • You can only rate each image once
        </p>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className={compact ? 'mt-2' : 'mt-4'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className={compact ? 'text-xs' : ''}>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}