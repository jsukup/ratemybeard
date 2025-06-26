'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Star, Users, Calendar, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: {
    id: string;
    image_url: string;
    username: string;
    median_score: number;
    rating_count: number;
    created_at: string;
  };
  rank: number | null;
}

export function ImageModal({ isOpen, onClose, image, rank }: ImageModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset loading state when image changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [image.id, isOpen]);

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, scale * delta));
    setScale(newScale);
  };

  // Handle touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !lastTouch || e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - lastTouch.x;
    const deltaY = touch.clientY - lastTouch.y;
    
    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastTouch({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastTouch(null);
  };

  // Handle mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setLastTouch({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastTouch) return;
    
    const deltaX = e.clientX - lastTouch.x;
    const deltaY = e.clientY - lastTouch.y;
    
    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastTouch({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastTouch(null);
  };

  // Reset image position and scale
  const resetImage = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRatingColor = (score: number) => {
    if (score >= 8.5) return 'text-green-600';
    if (score >= 7.0) return 'text-green-500';
    if (score >= 5.5) return 'text-yellow-500';
    if (score >= 4.0) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            {rank ? (
              <Badge variant="secondary" className="font-semibold">
                #{rank}
              </Badge>
            ) : (
              <Badge variant="outline" className="font-semibold">
                New Upload
              </Badge>
            )}
            <h2 className="text-xl font-semibold">{image.username}'s Image</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Image Container */}
        <div 
          ref={containerRef}
          className="relative bg-gray-50 overflow-hidden min-h-[300px] max-h-[60vh] cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={isDragging ? handleMouseMove : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500 p-8">
              <div>
                <p className="text-lg mb-2">Failed to load image</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setHasError(false);
                    setIsLoading(true);
                  }}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="flex items-center justify-center w-full h-full"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
            >
              <img
                ref={imageRef}
                src={image.image_url}
                alt={`${image.username}'s submission`}
                className="max-w-full max-h-full object-contain rounded select-none"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                style={{ display: isLoading ? 'none' : 'block' }}
                draggable={false}
              />
            </div>
          )}

          {/* Zoom Controls */}
          {!isLoading && !hasError && (
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setScale(prev => Math.min(3, prev * 1.2))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setScale(prev => Math.max(0.5, prev * 0.8))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 text-xs"
                onClick={resetImage}
                title="Reset zoom and position"
              >
                1:1
              </Button>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              {/* Rating */}
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                {rank ? (
                  <span className={`font-bold text-lg ${getRatingColor(image.median_score)}`}>
                    {image.median_score.toFixed(2)}
                  </span>
                ) : (
                  <span className="font-bold text-lg text-gray-500">
                    Not yet rated
                  </span>
                )}
              </div>
              
              {/* Vote Count */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 font-medium">
                  {image.rating_count} {image.rating_count === 1 ? 'vote' : 'votes'}
                  {!rank && ` • Needs ${Math.max(0, 10 - image.rating_count)} more`}
                </span>
              </div>
              
              {/* Date */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 text-sm">
                  {formatDate(image.created_at)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Download/save functionality
                  const link = document.createElement('a');
                  link.href = image.image_url;
                  link.download = `${image.username}_image.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Save Image
              </Button>
              <Button variant="default" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}