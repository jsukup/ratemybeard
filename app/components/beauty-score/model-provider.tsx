'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
// Import core functionality
import * as tf from '@tensorflow/tfjs';
// Import specific types we need
import type { Tensor, Tensor4D } from '@tensorflow/tfjs';
import type { LayersModel } from '@tensorflow/tfjs-layers';
import { loadLayersModel } from '@tensorflow/tfjs-layers';
import { ModelLoading, ModelError } from './model-loading';

// Types
interface ModelInfo {
  name: string;
  url: string;
  model: LayersModel | null;
}

interface PredictionResult {
  scut_score: number;
  mebeauty_score: number;
  ensemble_score: number;
  processing_time_ms: number;
}

interface ModelContextType {
  isLoading: boolean;
  hasError: boolean;
  error: Error | null;
  predict: (imageData: string) => Promise<PredictionResult>;
}

// Context
const ModelContext = createContext<ModelContextType | null>(null);

// Model registry
const models: { [key: string]: ModelInfo } = {
  scut: {
    name: 'SCUT-FBP5500',
    url: '',  // We'll set this in useEffect
    model: null,
  },
  mebeauty: {
    name: 'MEBeauty',
    url: '',  // We'll set this in useEffect
    model: null,
  },
};

// Helper functions
async function loadModel(modelKey: string): Promise<LayersModel> {
  const modelInfo = models[modelKey];
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelKey}`);
  }

  if (!modelInfo.url) {
    throw new Error(`Model URL not configured for ${modelKey}`);
  }

  try {
    const model = await loadLayersModel(modelInfo.url);
    modelInfo.model = model;
    return model;
  } catch (error) {
    throw error;
  }
}

async function preprocessImage(imageData: string): Promise<tf.Tensor4D> {
  try {
    // Ensure TensorFlow.js is ready
    if (!tf.getBackend()) {
      await tf.setBackend('webgl');
      await tf.ready();
    }

    // Create and load image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageData;
    });

    // Convert to tensor and preprocess
    const tensor = tf.browser.fromPixels(img);
    const resized = tf.image.resizeBilinear(tensor, [224, 224]);
    const batched = tf.expandDims(resized, 0);
    const normalized = tf.div(tf.cast(batched, 'float32'), tf.scalar(255));
    
    // Clean up intermediate tensors
    tensor.dispose();
    resized.dispose();
    batched.dispose();
    
    return normalized as tf.Tensor4D;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    throw error;
  }
}

// Components
function ModelProviderContent({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initializeModels() {
      try {
        // Initialize TensorFlow.js first
        if (!tf.getBackend()) {
          await tf.setBackend('webgl');
          await tf.ready();
        }
        console.log('TensorFlow.js initialized with backend:', tf.getBackend());

        // Set model URLs from environment variables
        const scutUrl = process.env.NEXT_PUBLIC_SCUT_MODEL_URL;
        const mebeautyUrl = process.env.NEXT_PUBLIC_MEBEAUTY_MODEL_URL;

        if (!scutUrl || !mebeautyUrl) {
          throw new Error('Model URLs not configured in environment variables');
        }

        // Update model URLs - use environment variables directly
        models.scut.url = scutUrl;
        models.mebeauty.url = mebeautyUrl;

        // Load models
        if (isMounted) {
          await Promise.all([
            loadModel('scut'),
            loadModel('mebeauty')
          ]);
          console.log('Models loaded successfully');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error initializing models:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize models'));
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    initializeModels();

    return () => {
      isMounted = false;
    };
  }, []);

  async function predict(imageData: string): Promise<PredictionResult> {
    const startTime = Date.now();

    try {
      if (!imageData?.startsWith('data:image/')) {
        throw new Error('Invalid image data format');
      }

      const scutModel = models.scut.model;
      const mebeautyModel = models.mebeauty.model;

      if (!scutModel || !mebeautyModel) {
        throw new Error('Models not loaded');
      }

      const preprocessed = await preprocessImage(imageData);
      const [scutPred, mebeautyPred] = await Promise.all([
        scutModel.predict(preprocessed) as tf.Tensor,
        mebeautyModel.predict(preprocessed) as tf.Tensor
      ]);

      const scut_score = (await scutPred.data())[0];
      const mebeauty_score = (await mebeautyPred.data())[0];
      const ensemble_score = (scut_score + mebeauty_score) / 2;

      tf.dispose([preprocessed, scutPred, mebeautyPred]);

      return {
        scut_score,
        mebeauty_score,
        ensemble_score,
        processing_time_ms: Date.now() - startTime
      };
    } catch (error) {
      console.error('Error in prediction:', error);
      throw error;
    }
  }

  if (isLoading) return <ModelLoading />;
  if (hasError && error) return <ModelError error={error} />;

  return (
    <ModelContext.Provider value={{ isLoading, hasError, error, predict }}>
      {children}
    </ModelContext.Provider>
  );
}

// Dynamically import the provider content with Suspense
const DynamicModelProviderContent = dynamic(
  () => Promise.resolve(ModelProviderContent),
  {
    loading: () => <ModelLoading />,
    ssr: false
  }
);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  return <DynamicModelProviderContent>{children}</DynamicModelProviderContent>;
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
} 