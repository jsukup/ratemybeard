import { NextRequest, NextResponse } from 'next/server';
import { runServerEnsemblePrediction } from './serverModelLoader';

// Configure for Edge Runtime to improve global performance
export const runtime = 'edge';

// Set duration to maximum allowed for hobby plan
export const maxDuration = 60;
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Add edge caching configuration
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto'; // Let Vercel choose the optimal region

// Request queue configuration
const RATE_LIMIT = 10; // Maximum concurrent requests
const RATE_LIMIT_WINDOW = 60000; // 1 minute window
let activeRequests = 0;
let requestQueue: Array<() => Promise<any>> = [];

// Process queue
async function processQueue() {
  if (requestQueue.length === 0 || activeRequests >= RATE_LIMIT) return;
  
  const nextRequest = requestQueue.shift();
  if (nextRequest) {
    activeRequests++;
    try {
      await nextRequest();
    } finally {
      activeRequests--;
      processQueue(); // Process next request
    }
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Forwards to either Replicate or model-inference API based on configuration
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const TIMEOUT_MS = 30000; // 30 second timeout for server-side processing
  
  try {
    // Set up timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Server processing timeout'));
      }, TIMEOUT_MS);
    });

    // Parse request body
    const body = await request.json();
    
    if (!body.image_data) {
      return NextResponse.json({ 
        error: 'Image data is required' 
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Add request to queue if at capacity
    if (activeRequests >= RATE_LIMIT) {
      return new Promise((resolve) => {
        requestQueue.push(async () => {
          try {
            const result = await Promise.race([
              runServerEnsemblePrediction(body.image_data),
              timeoutPromise
            ]);
            
            resolve(NextResponse.json({
              success: true,
              ...result,
              edge_location: request.headers.get('x-vercel-ip-city') || 'unknown',
              inference_provider: 'server',
              processing_time_ms: Date.now() - startTime
            }, {
              headers: corsHeaders
            }));
          } catch (error: any) {
            resolve(NextResponse.json({ 
              error: `Failed to process request: ${error.message || 'Unknown error'}`,
              edge_location: request.headers.get('x-vercel-ip-city') || 'unknown'
            }, { 
              status: 500,
              headers: corsHeaders
            }));
          }
        });
        
        processQueue();
      });
    }

    // Process request immediately if under capacity
    activeRequests++;
    try {
      const result = await Promise.race([
        runServerEnsemblePrediction(body.image_data),
        timeoutPromise
      ]);

      return NextResponse.json({
        success: true,
        ...result,
        edge_location: request.headers.get('x-vercel-ip-city') || 'unknown',
        inference_provider: 'server',
        processing_time_ms: Date.now() - startTime
      }, {
        headers: corsHeaders
      });
    } finally {
      activeRequests--;
      processQueue();
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: `Failed to process request: ${error.message || 'Unknown error'}`,
      edge_location: request.headers.get('x-vercel-ip-city') || 'unknown'
    }, { 
      status: 500,
      headers: corsHeaders
    });
  }
}

// The GET endpoint is used for preloading models
export async function GET(request: NextRequest) {
  try {
    // Log the environment and location
    console.log('Preloading models in environment:', process.env.NODE_ENV);
    console.log('Running from Edge location:', request.headers.get('x-vercel-ip-city') || 'unknown');
    
    const useReplicate = process.env.USE_REPLICATE === 'true';
    
    if (useReplicate) {
      // For Replicate, we don't need to preload models as they're managed by Replicate
      return NextResponse.json({ 
        message: 'Using Replicate - no preloading needed',
        status: 'success',
        location: request.headers.get('x-vercel-ip-city') || 'unknown',
        provider: 'replicate'
      }, { 
        headers: corsHeaders 
      });
    }
    
    // Get the request URL to build an absolute URL for internal API calls
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
    const baseUrl = `${protocol}://${host}`;

    console.log(`Using base URL for internal requests: ${baseUrl}`);
    
    // Forward the request to model-inference to trigger model loading
    // Use a minimal timeout since we don't need to wait for the entire loading process
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Preload request timed out')), 10000);
    });
    
    try {
      // Request the model-inference endpoint with a short timeout
      // We don't need to wait for it to complete, just to start the loading process
      await Promise.race([
        fetch(`${baseUrl}/api/model-inference`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_data: 'preload', preload_only: true })
        }),
        timeoutPromise
      ]);
    } catch (error) {
      // Ignore errors here - we don't need to wait for preloading to complete
      console.log('Preload request started but may not have completed:', error);
    }
    
    // Return immediately to avoid timeouts
    return NextResponse.json({ 
      message: 'Local models preloading initiated',
      status: 'success',
      location: request.headers.get('x-vercel-ip-city') || 'unknown',
      provider: 'local'
    }, { 
      headers: corsHeaders 
    });
  } catch (error: any) {
    console.error('Error starting model preload:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate model preloading',
      status: 'error'
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}

// Generate fallback simulated scores
function generateSimulatedScores() {
  // Generate scores between 1.0 and 5.0
  const scutScore = parseFloat((1.0 + Math.random() * 4.0).toFixed(2));
  const mebeautyScore = parseFloat((1.0 + Math.random() * 4.0).toFixed(2));
  const ensembleScore = parseFloat(((scutScore + mebeautyScore) / 2).toFixed(2));
  
  return {
    score: ensembleScore,
    details: {
      scut_score: scutScore,
      mebeauty_score: mebeautyScore,
      ensemble_score: ensembleScore,
    },
    processing_time_ms: 100 + Math.random() * 200, // Simulate processing time
  };
} 