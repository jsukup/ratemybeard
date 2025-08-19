"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Star } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { RatingButtonsGrid } from "@/components/RatingButtonsGrid";

interface RatingSliderProps {
  imageId: string;
  onSubmit: (rating: number) => void;
  disabled?: boolean;
  className?: string;
}

// Custom spinner component
function Spinner({ className }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-t-2 border-primary ${className || 'h-4 w-4'}`}></div>
  );
}

function RatingSliderComponent({ imageId, onSubmit, disabled = false, className = "" }: RatingSliderProps) {
  // Feature flag for discrete ratings
  const useDiscreteRatings = process.env.NEXT_PUBLIC_ENABLE_DISCRETE_RATINGS === 'true';
  
  // Legacy slider state
  const [rating, setRating] = useState<number[]>([5.00]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const currentRating = rating[0];

  const handleRatingChange = (value: number[]) => {
    setRating(value);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!imageId || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Get session ID from localStorage or generate one
      let sessionId = localStorage.getItem('ratemyfeet_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('ratemyfeet_session_id', sessionId);
      }

      const response = await fetch('/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          imageId,
          rating: Math.round(currentRating * 100) / 100, // More efficient than parseFloat
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit rating');
      }

      setSuccess(true);
      onSubmit(currentRating);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingDescription = (rating: number): string => {
    if (rating >= 9.0) return "Absolutely stunning!";
    if (rating >= 8.0) return "Very attractive";
    if (rating >= 7.0) return "Above average";
    if (rating >= 6.0) return "Decent";
    if (rating >= 5.0) return "Average";
    if (rating >= 4.0) return "Below average";
    if (rating >= 3.0) return "Not great";
    if (rating >= 2.0) return "Poor";
    if (rating >= 1.0) return "Very poor";
    return "Terrible";
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 8.0) return "text-green-600";
    if (rating >= 6.0) return "text-yellow-600";
    if (rating >= 4.0) return "text-orange-600";
    return "text-red-600";
  };

  // Use new discrete rating system if feature flag is enabled
  if (useDiscreteRatings) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Rate This Image
            <Star className="h-5 w-5 text-yellow-500" />
          </CardTitle>
          <CardDescription>
            Click a number to rate from 1 to 10
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <RatingButtonsGrid
            imageId={imageId}
            onSubmit={onSubmit}
            disabled={disabled}
            compact={false}
          />
        </CardContent>
      </Card>
    );
  }

  // Legacy slider implementation
  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Rate This Image
          <Star className="h-5 w-5 text-yellow-500" />
        </CardTitle>
        <CardDescription>
          Rate from 0.00 to 10.00 with 0.01 precision
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Rating Display */}
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-primary">
            {currentRating.toFixed(2)}
          </div>
          <div className={`text-sm font-medium ${getRatingColor(currentRating)}`}>
            {getRatingDescription(currentRating)}
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-4">
          <Slider
            value={rating}
            onValueChange={handleRatingChange}
            max={10}
            min={0}
            step={0.01}
            disabled={disabled || isSubmitting || success}
            className="w-full"
          />
          
          {/* Scale Labels */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.00</span>
            <span>2.50</span>
            <span>5.00</span>
            <span>7.50</span>
            <span>10.00</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <Star className="h-4 w-4" />
            <AlertDescription>
              Rating submitted successfully! Thank you for your feedback.
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={disabled || isSubmitting || success}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Submitting Rating...
            </>
          ) : success ? (
            'Rating Submitted!'
          ) : disabled ? (
            'Rating Disabled'
          ) : (
            `Submit Rating: ${currentRating.toFixed(2)}`
          )}
        </Button>

        {/* Helper Text */}
        {!success && (
          <p className="text-xs text-muted-foreground text-center">
            You can only rate each image once per session
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Export with Error Boundary wrapper
export default function RatingSlider(props: RatingSliderProps) {
  return (
    <ErrorBoundary 
      fallback={
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Unable to load rating component. Please refresh the page.
            </p>
          </CardContent>
        </Card>
      }
    >
      <RatingSliderComponent {...props} />
    </ErrorBoundary>
  );
}