import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.ROUTER_API_KEY || '',
  defaultHeaders: {
    "HTTP-Referer": "https://solvex-ai.vercel.app/",
    "X-Title": "Solvex AI"
  }
});

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
    // Check API key
    if (!process.env.ROUTER_API_KEY) {
      console.error('API key not found in environment variables');
      return response.status(500).json({
        error: 'Server configuration error',
        details: 'API key not configured'
      });
    }

    // Extract request body
    const { messages } = request.body;
    if (!messages || !Array.isArray(messages)) {
      return response.status(400).json({
        error: 'Invalid request',
        details: 'Messages array is required'
      });
    }

    // Create completion with timeout
    const timeoutMs = 30000;
    const completionPromise = openai.chat.completions.create({
      model: "google/gemini-2.5-pro-exp-03-25",
      messages: messages,
      timeout: timeoutMs
    });

    // Add timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]);

    return response.status(200).json({
      choices: [{
        message: {
          content: completion.choices[0].message.content
        }
      }]
    });

  } catch (error) {
    console.error('API Error:', error);
    
    if (error.message === 'Request timeout') {
      return response.status(504).json({
        error: 'Gateway timeout',
        details: 'The request took too long to complete'
      });
    }

    // Handle OpenAI API errors
    if (error.response?.status === 429) {
      return response.status(429).json({
        error: 'Rate limit exceeded',
        details: 'OpenRouter API rate limit exceeded. Please try again later.',
        retryAfter: 60
      });
    }

    return response.status(500).json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 