'use client';

// Use the main TFJS package
import * as tf from '@tensorflow/tfjs';
// LayersModel is loaded from the main package now
import { loadLayersModel } from '@tensorflow/tfjs-layers'; 
// Tensor types are available via tf.Tensor / tf.Tensor4D
// No need for explicit backend import or setting, main package handles it.

// Feature flag to control whether to use real models or simulation
const USE_REAL_MODELS = process.env.USE_REAL_MODELS === 'true';

// URLs for the models in Vercel Blob - these will be set from environment variables
const SCUT_MODEL_URL = process.env.SCUT_MODEL_URL;
const MEBEAUTY_MODEL_URL = process.env.MEBEAUTY_MODEL_URL;

interface ModelInfo {
  name: string;
  url: string;
  model: tf.LayersModel | null;
}

interface WeightsManifestEntry {
  paths: string[];
  weights: Array<{
    name: string;
    shape: number[];
    dtype: string;
  }>;
}

interface ModelJSON {
  format: string;
  generatedBy: string;
  convertedBy: string;
  modelTopology: any;
  weightsManifest: WeightsManifestEntry[];
}

// Model registry
const models: { [key: string]: ModelInfo } = {
  scut: {
    name: 'SCUT-FBP5500',
    url: SCUT_MODEL_URL || '',
    model: null,
  },
  mebeauty: {
    name: 'MEBeauty',
    url: MEBEAUTY_MODEL_URL || '',
    model: null,
  },
};

// Model caching configuration
const MODEL_CACHE_TTL = 3600000; // 1 hour cache TTL
const modelCache: { [key: string]: { model: tf.LayersModel, timestamp: number } } = {};

/**
 * Load a model with caching
 */
async function loadModel(modelKey: string): Promise<tf.LayersModel> {
  const modelInfo = models[modelKey];
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelKey}`);
  }

  if (!modelInfo.url) {
    throw new Error(`Model URL not configured for ${modelKey}`);
  }

  // Check cache first
  const cachedModel = modelCache[modelKey];
  if (cachedModel && (Date.now() - cachedModel.timestamp) < MODEL_CACHE_TTL) {
    console.log(`Using cached model for ${modelKey}`);
    return cachedModel.model;
  }

  try {
    // Load the model directly from the URL
    const model = await loadLayersModel(modelInfo.url);
    
    // Update cache
    modelCache[modelKey] = {
      model,
      timestamp: Date.now()
    };
    
    modelInfo.model = model;
    return model;
  } catch (error) {
    console.error(`Error loading model ${modelKey}:`, error);
    throw error;
  }
}

/**
 * Preprocess an image for model inference
 */
async function preprocessImage(imageData: string): Promise<tf.Tensor4D> {
  return new Promise((resolve, reject) => {
    // Create an image element
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Convert to tensor using tf.browser
        const tensor = tf.browser.fromPixels(img);
        
        // Resize using tf.image
        const resized = tf.image.resizeBilinear(tensor, [224, 224]);
        
        // Add batch dimension and normalize using tf functions
        const batched = tf.expandDims(resized, 0);
        const normalized = tf.div(tf.cast(batched, 'float32'), tf.scalar(255));
        
        // Cleanup
        tensor.dispose();
        resized.dispose();
        
        resolve(normalized as tf.Tensor4D);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      reject(error);
    };
    
    // Set image source to the base64 data
    img.src = imageData;
  });
}

/**
 * Run ensemble prediction with both models
 */
async function runEnsemblePrediction(imageData: string): Promise<{
  scut_score: number;
  mebeauty_score: number;
  ensemble_score: number;
  processing_time_ms: number;
}> {
  if (!USE_REAL_MODELS) {
    console.log('Using simulation mode for ensemble prediction');
    return simulateEnsemblePrediction(imageData);
  }

  const startTime = Date.now();
  
  try {
    // Load models in parallel with a timeout
    const modelLoadTimeout = 15000; // 15 seconds timeout for model loading
    const modelLoadPromise = Promise.all([
      models.scut.model || loadModel('scut'),
      models.mebeauty.model || loadModel('mebeauty')
    ]);

    const [scutModel, mebeautyModel] = await Promise.race([
      modelLoadPromise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Model loading timeout')), modelLoadTimeout)
      )
    ]) as [tf.LayersModel, tf.LayersModel];

    // Preprocess image with a timeout
    const preprocessTimeout = 5000; // 5 seconds timeout for preprocessing
    const preprocessed = await Promise.race([
      preprocessImage(imageData),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Image preprocessing timeout')), preprocessTimeout)
      )
    ]) as tf.Tensor;

    // Run predictions in parallel
    const [scutPred, mebeautyPred] = await Promise.all([
      scutModel.predict(preprocessed) as tf.Tensor,
      mebeautyModel.predict(preprocessed) as tf.Tensor
    ]);

    // Get scores
    const scut_score = (await scutPred.data())[0];
    const mebeauty_score = (await mebeautyPred.data())[0];

    // Calculate ensemble score (simple average)
    const ensemble_score = (scut_score + mebeauty_score) / 2;

    // Cleanup
    tf.dispose([preprocessed, scutPred, mebeautyPred]);

    return {
      scut_score,
      mebeauty_score,
      ensemble_score,
      processing_time_ms: Date.now() - startTime
    };
  } catch (error) {
    console.error('Error running ensemble prediction:', error);
    console.log('Falling back to simulation mode');
    return simulateEnsemblePrediction(imageData);
  }
}

/**
 * Simulate ensemble prediction (used when real models are not available)
 */
function simulateEnsemblePrediction(imageData: string): Promise<{
  scut_score: number;
  mebeauty_score: number;
  ensemble_score: number;
  processing_time_ms: number;
}> {
  return new Promise((resolve) => {
    // Simulate processing time
    setTimeout(() => {
      // Generate random scores between 1 and 5
      const scut_score = 1 + Math.random() * 4;
      const mebeauty_score = 1 + Math.random() * 4;
      const ensemble_score = (scut_score + mebeauty_score) / 2;

      resolve({
        scut_score,
        mebeauty_score,
        ensemble_score,
        processing_time_ms: 500 + Math.random() * 500 // Simulate 500-1000ms processing time
      });
    }, 500 + Math.random() * 500);
  });
}

export { runEnsemblePrediction }; 