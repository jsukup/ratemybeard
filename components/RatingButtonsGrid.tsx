"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Star, Loader2 } from "lucide-react";
import { getOrCreateSessionId } from '@/lib/session';
import confetti from 'canvas-confetti';

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

  // Color mapping for ratings 1-10 (red to gold gradient)
  const getRatingColor = (rating: number): string => {
    const colors = [
      "bg-gradient-to-br from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/30",
      "bg-gradient-to-br from-red-500 to-red-400 hover:from-red-600 hover:to-red-500 text-white shadow-lg shadow-red-400/30",
      "bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg shadow-orange-500/30",
      "bg-gradient-to-br from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg shadow-orange-400/30",
      "bg-gradient-to-br from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-white shadow-lg shadow-yellow-400/30",
      "bg-gradient-to-br from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white shadow-lg shadow-amber-400/30", // Swapped from 7 to 6
      "bg-gradient-to-br from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white shadow-lg shadow-amber-400/30", // Swapped from 6 to 7
      "bg-gradient-to-br from-amber-400 to-yellow-300 hover:from-amber-500 hover:to-yellow-400 text-white shadow-lg shadow-amber-300/30",
      "bg-gradient-to-br from-yellow-300 to-yellow-200 hover:from-yellow-400 hover:to-yellow-300 text-gray-800 shadow-lg shadow-yellow-300/40",
      "bg-gradient-to-br from-yellow-300 to-yellow-100 hover:from-yellow-400 hover:to-yellow-200 text-gray-800 shadow-xl shadow-yellow-300/50"
    ];
    return colors[rating - 1] || colors[0];
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

  const triggerConfetti = (rating: number) => {
    // Low ratings (1-3): Red particles falling down
    if (rating <= 3) {
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.4 },
        colors: ['#ef4444', '#dc2626', '#b91c1c'],
        gravity: 2,
        ticks: 50,
        startVelocity: 10,
        shapes: ['circle'],
        scalar: 0.7,
      });
    }
    // Mid ratings (4-7): Yellow/amber particles floating
    else if (rating <= 7) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
        gravity: 0.5,
        ticks: 80,
        startVelocity: 20,
        shapes: ['square', 'circle'],
        scalar: 0.8,
      });
    }
    // High ratings (8-10): Gold confetti burst
    else {
      // Multiple bursts for celebration effect
      const count = 200;
      const defaults = {
        origin: { y: 0.7 }
      };

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
          colors: ['#fbbf24', '#f59e0b', '#eab308', '#facc15', '#fde047'],
          shapes: ['star', 'circle'],
          scalar: 1.2,
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
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
      
      // Trigger confetti effect based on rating value
      triggerConfetti(rating);
      
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
              ${selectedRating === rating ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}
              ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}
              transition-all duration-200 font-bold rounded-lg
              transform hover:scale-105 active:scale-95 active:translate-y-0.5
              border border-white/20 backdrop-blur-sm
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
              ${selectedRating === rating ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}
              ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}
              transition-all duration-200 font-bold rounded-lg
              transform hover:scale-105 active:scale-95 active:translate-y-0.5
              border border-white/20 backdrop-blur-sm
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