import { NextRequest } from 'next/server';

interface PredictionResult {
  scut_score: number;
  mebeauty_score: number;
  ensemble_score: number;
  processing_time_ms: number;
}

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const SCUT_MODEL_VERSION = 'jsukup/scut-beauty-model:91d1c9a7d4fe62db3aab90e21fc0607533cc840ed709faeecef337a9f76682ff';
const MEBEAUTY_MODEL_VERSION = 'jsukup/mebeauty-model:c3d9fcf4795798730934d71c80865e9a914bdd250a4da21aae46174521ea8b6f';

/**
 * Run prediction using Replicate API
 */
export async function runReplicatePrediction(imageData: string): Promise<PredictionResult> {
  const startTime = Date.now();

  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  try {
    console.log('Starting Replicate predictions for both models...');
    
    // Run both predictions in parallel
    const [scutResult, mebeautyResult] = await Promise.all([
      runModelPrediction(SCUT_MODEL_VERSION, imageData),
      runModelPrediction(MEBEAUTY_MODEL_VERSION, imageData)
    ]);
    
    // Process the results
    const scutScore = parseFloat(scutResult.output.score || '0');
    const mebeautyScore = parseFloat(mebeautyResult.output.score || '0');
    const ensembleScore = (scutScore + mebeautyScore) / 2;

    console.log('Replicate predictions completed:', {
      scutScore,
      mebeautyScore,
      ensembleScore
    });

    return {
      scut_score: scutScore,
      mebeauty_score: mebeautyScore,
      ensemble_score: ensembleScore,
      processing_time_ms: Date.now() - startTime
    };
  } catch (error) {
    console.error('Error in Replicate prediction:', error);
    throw error;
  }
}

/**
 * Run a single model prediction
 */
async function runModelPrediction(modelVersion: string, imageData: string) {
  console.log(`Starting prediction for model version: ${modelVersion}`);
  
  // Start the prediction
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait' // Wait for the prediction to complete
    },
    body: JSON.stringify({
      version: modelVersion,
      input: {
        image: imageData
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Replicate API error for ${modelVersion}:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`Replicate API error: ${response.statusText} - ${errorText}`);
  }

  const prediction = await response.json();
  console.log(`Prediction started for ${modelVersion}:`, prediction.id);
  
  // Poll for results
  return await pollPrediction(prediction.id);
}

/**
 * Poll for prediction results
 */
async function pollPrediction(predictionId: string) {
  const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max
  const interval = 2000; // 2 seconds between attempts

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to get prediction status for ${predictionId}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to get prediction status: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`Prediction ${predictionId} status:`, result.status);

    if (result.status === 'succeeded') {
      return result;
    } else if (result.status === 'failed') {
      throw new Error(`Prediction failed: ${result.error}`);
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Prediction timed out');
} 