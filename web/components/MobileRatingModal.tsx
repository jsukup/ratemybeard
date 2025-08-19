'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RatingButtonsGrid } from '@/components/RatingButtonsGrid';
import { Slider } from '@/components/ui/slider';
import { getOrCreateSessionId } from '@/lib/session';

interface MobileRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: {
    id: string;
    image_url: string;
    username: string;
  };
  onRatingSubmit: (rating: number, updatedStats?: { median_score: number; rating_count: number }) => void;
}

export function MobileRatingModal({ isOpen, onClose, image, onRatingSubmit }: MobileRatingModalProps) {
  // Feature flag for discrete ratings
  const useDiscreteRatings = process.env.NEXT_PUBLIC_ENABLE_DISCRETE_RATINGS === 'true';
  
  // Legacy slider state (only used when discrete ratings are disabled)
  const [sliderRating, setSliderRating] = useState<number[]>([5.0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSliderRating([5.0]);
      setIsSubmitting(false);
      setError(null);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle discrete rating submission (for RatingButtonsGrid)
  const handleDiscreteRatingSubmit = (rating: number) => {
    console.log('Mobile discrete rating submitted:', rating);
    onRatingSubmit(rating);
    onClose();
  };

  // Handle legacy slider rating submission
  const handleSliderSubmit = async () => {
    if (isSubmitting) return;

    const currentRating = sliderRating[0];
    setIsSubmitting(true);
    setError(null);

    try {
      const sessionId = getOrCreateSessionId();
      
      if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
        throw new Error('Invalid session ID');
      }

      const response = await fetch('/api/ratings/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionId.trim()
        },
        body: JSON.stringify({ imageId: image.id, rating: currentRating })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit rating');
      }

      const result = await response.json();
      console.log('Mobile slider rating submission successful:', result);
      
      onRatingSubmit(currentRating, result.updatedStats);
      onClose();
    } catch (err) {
      console.error('Mobile rating submission failed:', err);
      
      let errorMessage = 'Failed to submit rating. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('Already rated')) {
          errorMessage = 'You have already rated this image.';
        } else if (err.message.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-sm w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Rate {image.username}&apos;s image</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Image */}
        <div className="p-4">
          <img 
            src={image.image_url} 
            alt={`${image.username}'s submission`}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />

          {/* Rating Interface */}
          {useDiscreteRatings ? (
            // Use discrete button rating system
            <RatingButtonsGrid
              imageId={image.id}
              onSubmit={handleDiscreteRatingSubmit}
              disabled={isSubmitting}
              compact={false}
            />
          ) : (
            // Use legacy slider rating system
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-lg font-semibold">
                  {sliderRating[0].toFixed(2)}
                </span>
              </div>
              
              <Slider
                value={sliderRating}
                onValueChange={setSliderRating}
                max={10}
                min={0}
                step={0.01}
                disabled={isSubmitting}
                className="w-full"
              />
              
              <Button 
                onClick={handleSliderSubmit}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </Button>

              {error && (
                <div className="text-sm text-red-600 text-center">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}