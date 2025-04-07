import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || process.env.ROUTER_API_KEY || '',
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
    // Check API key with better error message
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.ROUTER_API_KEY;
    if (!apiKey) {
      console.error('API key not found in environment variables. Please set OPENROUTER_API_KEY or ROUTER_API_KEY');
      return response.status(500).json({
        error: 'Server configuration error',
        details: 'API key not configured. Please check server environment variables.'
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
      model: "google/gemini-2.5-pro-exp-03-25:free",
      messages: messages,
      timeout: timeoutMs,
      stream: false
    });

    // Add timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]);

    // Check if completion and its properties exist
    if (!completion || !completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      throw new Error('Invalid response from OpenRouter API');
    }

    return response.status(200).json({
      choices: [{
        message: {
          content: completion.choices[0].message.content || ''
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

    // Handle model not found error
    if (error.message?.includes('No endpoints found')) {
      return response.status(400).json({
        error: 'Model not available',
        details: 'The requested model is not available. Please try again later or contact support.'
      });
    }

    // Handle invalid response error
    if (error.message?.includes('Invalid response')) {
      return response.status(502).json({
        error: 'Bad Gateway',
        details: 'Received an invalid response from the AI service. Please try again.'
      });
    }

    return response.status(500).json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 