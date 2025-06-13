'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useModel } from './model-provider';
import { UpdateIcon, ReloadIcon } from "@radix-ui/react-icons"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface PredictionDisplay {
  imageUrl: string;
  scut_score: number;
  mebeauty_score: number;
  ensemble_score: number;
  processing_time_ms: number;
}

export function BeautyScoreCard() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { predict, isLoading: isModelLoading, hasError, error: modelError } = useModel();
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [prediction, setPrediction] = useState<PredictionDisplay | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function handleImageUpload(file: File) {
    try {
      setError(null);
      setIsPredicting(true);

      // Convert file to base64
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });

      // Run prediction
      const result = await predict(imageData);

      // Update state with results
      setPrediction({
        imageUrl: imageData,
        ...result
      });
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err instanceof Error ? err : new Error('Failed to process image'));
    } finally {
      setIsPredicting(false);
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        setError(new Error('Please upload an image file'));
        return;
      }
      await handleImageUpload(file);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError(new Error('Please upload an image file'));
        return;
      }
      await handleImageUpload(file);
    }
  }

  if (isModelLoading) return null;
  if (hasError && modelError) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Beauty Score Analysis</CardTitle>
        <CardDescription>
          Upload an image to analyze its beauty score using AI models
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            "hover:border-primary/50 hover:bg-muted/50",
            error ? "border-destructive/50 bg-destructive/10" : "border-muted-foreground/25"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          {isPredicting ? (
            <div className="flex flex-col items-center justify-center p-6 space-y-2">
              <ReloadIcon className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 h-48">
              <UpdateIcon className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop an image, or click to select
              </p>
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                Select Image
              </Button>
            </div>
          )}
          <input
            type="file"
            className="hidden"
            accept="image/png, image/jpeg"
            ref={fileInputRef}
            onChange={handleFileSelect}
            disabled={isPredicting}
          />
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {/* Reset Button */}
        {(prediction || error) && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setPrediction(null);
              setError(null);
            }}
          >
            Analyze Another Image
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 