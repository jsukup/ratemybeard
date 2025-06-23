"use client";

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { hasRatedImage } from '@/utils/sessionManager';
import RatingSlider from './RatingSlider';

interface RatingStatusProps {
  imageId: string;
  onRatingSubmitted?: (rating: number) => void;
  className?: string;
}

export default function RatingStatus({ 
  imageId, 
  onRatingSubmitted, 
  className = "" 
}: RatingStatusProps) {
  const [hasRated, setHasRated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if the current session has already rated this image
  useEffect(() => {
    checkRatingStatus();
  }, [imageId]);

  const checkRatingStatus = async () => {
    if (!imageId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const rated = await hasRatedImage(imageId);
      setHasRated(rated);
    } catch (err) {
      console.error('Error checking rating status:', err);
      setError('Failed to check rating status');
      // On error, assume not rated to allow rating attempt
      setHasRated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmitted = (rating: number) => {
    // Mark as rated
    setHasRated(true);
    // Call parent callback
    onRatingSubmitted?.(rating);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>
        <span className="ml-2 text-sm text-muted-foreground">Checking rating status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <button 
            onClick={checkRatingStatus}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  if (hasRated) {
    return (
      <Alert className={`border-green-200 bg-green-50 text-green-800 ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>You have already rated this image</span>
          <button 
            onClick={checkRatingStatus}
            className="text-xs underline hover:no-underline opacity-70"
          >
            Refresh
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show rating slider if not rated yet
  return (
    <div className={className}>
      <RatingSlider 
        imageId={imageId} 
        onSubmit={handleRatingSubmitted}
      />
    </div>
  );
}