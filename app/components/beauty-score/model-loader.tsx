'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

interface PredictionResult {
  scut_score: number;
  mebeauty_score: number;
  ensemble_score: number;
  processing_time_ms: number;
}

interface ModelLoaderProps {
  imageData: string;
  onResult: (result: PredictionResult) => void;
  onError: (error: Error) => void;
}

// Type guard function to validate PredictionResult
function isPredictionResult(value: any): value is PredictionResult {
  return (
    typeof value === 'object' &&
    typeof value.scut_score === 'number' &&
    typeof value.mebeauty_score === 'number' &&
    typeof value.ensemble_score === 'number' &&
    typeof value.processing_time_ms === 'number'
  );
}

function ModelLoader({ imageData, onResult, onError }: ModelLoaderProps) {
  // Validate imageData
  useEffect(() => {
    if (!imageData) {
      console.error('ImageData is empty or undefined');
      onError(new Error('No image data provided'));
      return;
    }

    // Validate image data format
    if (!imageData.startsWith('data:image/')) {
      console.error('Invalid image data format:', imageData.slice(0, 30) + '...');
      onError(new Error('Invalid image data format'));
      return;
    }

    const runPrediction = async () => {
      try {
        console.log('Starting prediction with image data length:', imageData.length);
        
        // Make API call to the ensemble endpoint
        const response = await fetch('/api/ensemble', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image_data: imageData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process image');
        }

        const result = await response.json();
        
        // Validate result before calling onResult
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid prediction result format');
        }

        if (!isPredictionResult(result)) {
          throw new Error('Invalid prediction result format: missing or invalid fields');
        }

        console.log('Prediction completed successfully:', result);
        onResult(result);
      } catch (error) {
        console.error('Prediction failed:', error);
        onError(error instanceof Error ? error : new Error('Prediction failed: ' + String(error)));
      }
    };

    runPrediction();
  }, [imageData, onResult, onError]);

  return null; // This is a non-visual component
}

// Export with dynamic import and loading state
export const ModelLoaderWithSuspense = dynamic(
  () => Promise.resolve(ModelLoader),
  {
    loading: () => (
      <div className="flex items-center justify-center space-x-2">
        <div className="animate-pulse text-sm text-muted-foreground">
          Loading AI models...
        </div>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
    ssr: false // Disable server-side rendering as we need browser APIs
  }
); 