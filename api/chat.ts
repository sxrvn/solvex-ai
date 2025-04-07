import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory rate limiting store - this will reset on serverless function cold starts
// but provides some protection during active usage periods
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
let rateLimitStore: Record<string, RateLimitRecord> = {};

// Rate limit configuration
const RATE_LIMIT = {
  requestsPerMinute: 5,
  windowMs: 60 * 1000, // 1 minute
  penaltyMultiplier: 2, // each successive violation doubles the wait time
};

// Simple rate limiting function
function isRateLimited(ip: string): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  
  // Clean up expired entries
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetAt < now) {
      delete rateLimitStore[key];
    }
  });
  
  // Get or create record for this IP
  if (!rateLimitStore[ip]) {
    rateLimitStore[ip] = {
      count: 0,
      resetAt: now + RATE_LIMIT.windowMs
    };
  }
  
  const record = rateLimitStore[ip];
  
  // If the reset time has passed, reset the counter
  if (record.resetAt < now) {
    record.count = 0;
    record.resetAt = now + RATE_LIMIT.windowMs;
  }
  
  // Increment the counter
  record.count++;
  
  // Check if rate limited
  if (record.count > RATE_LIMIT.requestsPerMinute) {
    // Calculate penalty time based on how many times they've exceeded the limit
    const penaltyFactor = Math.min(Math.pow(RATE_LIMIT.penaltyMultiplier, 
      record.count - RATE_LIMIT.requestsPerMinute - 1), 16); // Cap at 16x penalty
    
    const penaltyTimeMs = RATE_LIMIT.windowMs * penaltyFactor;
    record.resetAt = now + penaltyTimeMs;
    
    const retryAfter = Math.ceil(penaltyTimeMs / 1000);
    return { limited: true, retryAfter };
  }
  
  return { limited: false, retryAfter: 0 };
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

  try {
    // Get client IP for rate limiting
    const ip = request.headers['x-forwarded-for'] || 
               request.headers['x-real-ip'] || 
               'unknown-ip';
    
    // Check rate limit
    const clientIp = Array.isArray(ip) ? ip[0] : ip;
    const rateLimit = isRateLimited(clientIp as string);
    
    if (rateLimit.limited) {
      console.log(`Rate limited IP: ${clientIp}, retry after: ${rateLimit.retryAfter}s`);
      return response.status(429).json({
        error: 'Rate limit exceeded',
        details: `Please wait ${rateLimit.retryAfter} seconds before trying again`,
        retryAfter: rateLimit.retryAfter
      });
    }

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

      // Handle rate limiting from the upstream API
      if (apiResponse.status === 429) {
        const retryAfter = apiResponse.headers.get('Retry-After') || '60';
        const retrySeconds = parseInt(retryAfter);
        
        // Update our rate limit store to enforce upstream rate limits as well
        rateLimitStore[clientIp as string] = {
          count: RATE_LIMIT.requestsPerMinute + 2, // Force a penalty
          resetAt: Date.now() + (retrySeconds * 1000)
        };
        
        return response.status(429).json({
          error: 'Rate limit exceeded',
          details: `Please wait ${retrySeconds} seconds before trying again`,
          retryAfter: retrySeconds
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