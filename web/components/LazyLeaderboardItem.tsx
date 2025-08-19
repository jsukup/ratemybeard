"use client";

import { memo, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star, AlertCircle } from "lucide-react";
import { optimizeImageUrl, createPlaceholderUrl, LAZY_LOADING_OPTIONS } from '@/utils/imageOptimization';
import RatingStatus from './RatingStatus';

interface LeaderboardImage {
  id: string;
  username: string;
  image_url: string;
  median_score: number;
  rating_count: number;
  created_at: string;
  category: string;
}

interface LazyLeaderboardItemProps {
  image: LeaderboardImage;
  globalRank: number;
  isNewSubmission?: boolean;
  onRatingSubmitted?: (imageId: string, rating: number) => void;
  className?: string;
}

// Skeleton placeholder component
function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={`bg-gray-200 animate-pulse rounded-lg ${className}`}>
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-400 text-xs">Loading...</div>
      </div>
    </div>
  );
}

// Error placeholder component
function ImageError({ className, onRetry }: { className?: string; onRetry?: () => void }) {
  return (
    <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}>
      <div className="text-center p-2">
        <AlertCircle className="h-4 w-4 text-gray-400 mx-auto mb-1" />
        <div className="text-xs text-gray-500 mb-1">Failed to load</div>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="text-xs text-blue-500 hover:text-blue-700 underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

// Optimized image component with lazy loading
function OptimizedImage({ 
  src, 
  alt, 
  className, 
  onLoad, 
  onError 
}: {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Generate optimized URLs
  const optimizedSrc = optimizeImageUrl(src, { width: 64, height: 64, quality: 85 });
  const placeholderSrc = createPlaceholderUrl(src);

  const handleLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  const handleRetry = () => {
    setImageError(false);
    setRetryCount(prev => prev + 1);
  };

  if (imageError && retryCount >= 3) {
    return <ImageError className={className} />;
  }

  if (imageError) {
    return <ImageError className={className} onRetry={handleRetry} />;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Placeholder/blur effect */}
      {!imageLoaded && (
        <img
          src={placeholderSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover rounded-lg blur-sm scale-105"
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      <img
        key={`${src}-${retryCount}`} // Force re-render on retry
        src={optimizedSrc}
        alt={alt}
        className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}

const LazyLeaderboardItem = memo(function LazyLeaderboardItem({
  image,
  globalRank,
  isNewSubmission = false,
  onRatingSubmitted,
  className = ""
}: LazyLeaderboardItemProps) {
  const { ref, inView } = useInView(LAZY_LOADING_OPTIONS);
  const [imageLoadError, setImageLoadError] = useState(false);

  const handleRatingSubmitted = (rating: number) => {
    onRatingSubmitted?.(image.id, rating);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <TableRow 
      ref={ref}
      className={`${
        isNewSubmission ? "bg-green-50 border-green-200" : ""
      } ${className}`}
    >
      {/* Rank */}
      <TableCell className="font-medium">
        #{globalRank}
      </TableCell>

      {/* Image */}
      <TableCell>
        <div className="relative">
          {inView ? (
            <OptimizedImage
              src={image.image_url}
              alt={`${image.username}'s submission`}
              className="w-16 h-16"
              onError={() => setImageLoadError(true)}
            />
          ) : (
            <ImagePlaceholder className="w-16 h-16" />
          )}
          
          {/* New submission badge */}
          {isNewSubmission && (
            <Badge className="absolute -top-2 -right-2 text-xs bg-green-500">
              New!
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Username */}
      <TableCell className="font-medium">
        {image.username}
      </TableCell>

      {/* Rating */}
      <TableCell className="text-center">
        {inView ? (
          <div className="flex items-center justify-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-bold text-lg">
              {image.median_score.toFixed(2)}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        )}
      </TableCell>

      {/* Vote Count */}
      <TableCell className="text-center">
        {inView ? (
          <Badge variant="outline">
            {image.rating_count}
          </Badge>
        ) : (
          <div className="w-8 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
        )}
      </TableCell>

      {/* Date */}
      <TableCell className="text-center text-sm text-muted-foreground">
        {inView ? (
          formatDate(image.created_at)
        ) : (
          <div className="w-12 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
        )}
      </TableCell>

      {/* Rating Action */}
      <TableCell className="text-center">
        {inView && !imageLoadError ? (
          <RatingStatus
            imageId={image.id}
            onRatingSubmitted={handleRatingSubmitted}
            className="min-w-0"
          />
        ) : (
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse mx-auto"></div>
        )}
      </TableCell>
    </TableRow>
  );
});

LazyLeaderboardItem.displayName = 'LazyLeaderboardItem';

export default LazyLeaderboardItem;