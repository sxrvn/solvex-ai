import type { VercelRequest, VercelResponse } from '@vercel/node';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 5;
const requestCounts = new Map<string, { count: number; timestamp: number }>();

function getRateLimitInfo(ip: string): { isLimited: boolean; retryAfter: number } {
  const now = Date.now();
  const windowData = requestCounts.get(ip);

  if (!windowData) {
    requestCounts.set(ip, { count: 1, timestamp: now });
    return { isLimited: false, retryAfter: 0 };
  }

  if (now - windowData.timestamp > RATE_LIMIT_WINDOW) {
    // Reset window if it's expired
    requestCounts.set(ip, { count: 1, timestamp: now });
    return { isLimited: false, retryAfter: 0 };
  }

  if (windowData.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - windowData.timestamp)) / 1000);
    return { isLimited: true, retryAfter };
  }

  // Increment request count
  windowData.count += 1;
  requestCounts.set(ip, windowData);
  return { isLimited: false, retryAfter: 0 };
}

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

  // Check rate limit
  const clientIp = request.headers['x-forwarded-for'] as string || 'unknown';
  const { isLimited, retryAfter } = getRateLimitInfo(clientIp);
  
  if (isLimited) {
    response.setHeader('Retry-After', retryAfter.toString());
    return response.status(429).json({
      error: 'Rate limit exceeded',
      details: `Please wait ${retryAfter} seconds before trying again`,
      retryAfter
    });
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

      // Handle upstream rate limiting
      if (apiResponse.status === 429) {
        const retryAfter = apiResponse.headers.get('Retry-After') || '60';
        // Remove the rate limit count for this request since it failed
        const windowData = requestCounts.get(clientIp);
        if (windowData) {
          windowData.count = Math.max(0, windowData.count - 1);
          requestCounts.set(clientIp, windowData);
        }
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