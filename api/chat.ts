import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for API key in different environment variable names
    const apiKey = process.env.ROUTER_API_KEY || process.env.VITE_ROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('API key not found in environment variables');
      return response.status(500).json({
        error: 'Server configuration error',
        details: 'API key not configured'
      });
    }

    console.log('Making request to router.requesty.ai...');
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const apiResponse = await fetch('https://router.requesty.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(request.body),
        signal: controller.signal
      });

      clearTimeout(timeout);

      // Handle rate limiting
      if (apiResponse.status === 429) {
        const retryAfter = apiResponse.headers.get('Retry-After') || '60';
        return response.status(429).json({
          error: 'Rate limit exceeded',
          details: `Please wait ${retryAfter} seconds before trying again`,
          retryAfter: parseInt(retryAfter)
        });
      }

      let data;
      try {
        data = await apiResponse.json();
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        return response.status(500).json({
          error: 'Invalid API response',
          details: 'Failed to parse API response'
        });
      }

      if (!apiResponse.ok) {
        console.error('API Error Response:', {
          status: apiResponse.status,
          data: data
        });
        
        return response.status(apiResponse.status).json({
          error: 'API request failed',
          details: data.error?.message || `Status ${apiResponse.status}`,
          status: apiResponse.status
        });
      }

      return response.status(200).json(data);
    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError.name === 'AbortError') {
        return response.status(504).json({
          error: 'Request timeout',
          details: 'The request took too long to complete'
        });
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Server Error:', error);
    
    return response.status(500).json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : 'Unknown'
    });
  }
} 