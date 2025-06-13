import { NextResponse, NextRequest } from 'next/server';

/**
 * Maximum duration for this API route on serverless environments
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
 */
export const maxDuration = 60; // Set max duration to 60 seconds for Vercel

/**
 * Analyze endpoint that proxies to the /api/ensemble endpoint
 * 
 * This route exists for backward compatibility and API separation.
 * It forwards requests to the /api/ensemble endpoint which handles the actual model prediction.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('Error parsing request JSON:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Check if we have image data
    if (!body.image_data) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    console.log('Forwarding image analysis request to /api/ensemble');
    
    // Forward the request to the ensemble endpoint
    try {
      // Get the host from the request headers
      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      
      // Build the ensemble API URL using the same host
      const ensembleUrl = `${protocol}://${host}/api/ensemble`;
      console.log('Forwarding to:', ensembleUrl);
      
      // Set timeout for the fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 95000); // Increased from 30000 to 95000 (95 seconds)
      
      try {
        // Add the internal API key for server-to-server communication
        const internalKey = process.env.INTERNAL_API_KEY || 'looxmaxx-internal-key';
        
        const response = await fetch(ensembleUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'x-internal-api-key': internalKey
          },
          body: JSON.stringify({
            image_data: body.image_data
          }),
          signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        // Check content type before attempting to parse JSON
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          // The response is not JSON, likely HTML error page
          const textResponse = await response.text();
          console.error('Received non-JSON response:', 
            textResponse.substring(0, 150) + '...');
          
          return NextResponse.json(
            { 
              error: 'Received HTML error page instead of JSON from ensemble endpoint',
              details: `Status: ${response.status} ${response.statusText}`,
              path: ensembleUrl
            },
            { status: 500 }
          );
        }
        
        // Read the response body once and store it
        let responseData;
        try {
          responseData = await response.json();
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          return NextResponse.json(
            { error: 'Failed to parse JSON response from ensemble endpoint' },
            { status: 500 }
          );
        }
        
        if (!response.ok) {
          console.error('Error from ensemble API:', responseData);
          return NextResponse.json(
            { error: responseData.error || 'Failed to process image' },
            { status: response.status }
          );
        }
        
        // Use the already read responseData instead of calling response.json() again
        console.log('Received analysis result from ensemble endpoint');
        
        // Return a standardized response structure from the analyze endpoint
        return NextResponse.json({
          score: responseData.score,
          details: responseData.details || {},
          processing_time: responseData.processing_time,
          success: true
        });
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.error('Fetch request timed out after 95 seconds');
          return NextResponse.json(
            { error: 'Ensemble endpoint request timed out' },
            { status: 504 }
          );
        }
        
        console.error('Fetch error:', fetchError);
        throw fetchError; // Let the outer catch handle other fetch errors
      }
      
    } catch (error) {
      console.error('Error forwarding to ensemble endpoint:', error);
      
      // More descriptive error message based on error type
      let errorMessage = 'Failed to connect to ensemble endpoint';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error connecting to ensemble endpoint';
      } else if (error instanceof Error) {
        errorMessage = `Error connecting to ensemble endpoint: ${error.message}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in analyze API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 