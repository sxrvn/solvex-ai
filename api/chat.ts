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
    
    const apiResponse = await fetch('https://router.requesty.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(request.body)
    });

    const data = await apiResponse.json();

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
  } catch (error) {
    console.error('Server Error:', error);
    
    return response.status(500).json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : 'Unknown'
    });
  }
} 