import { createClient } from "npm:openai@4.28.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ROUTER_API_KEY = Deno.env.get("ROUTER_API_KEY");

if (!ROUTER_API_KEY) {
  throw new Error("ROUTER_API_KEY is required");
}

const openai = createClient({
  apiKey: ROUTER_API_KEY,
  baseURL: "https://router.requesty.ai/v1",
  defaultHeaders: { "Authorization": `Bearer ${ROUTER_API_KEY}` }
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const maxRetries = 3;
  let retryCount = 0;
  let lastError = null;

  while (retryCount < maxRetries) {
    try {
      const { question, imageUrl } = await req.json();
      
      let content = question;
      if (imageUrl) {
        content = [
          { type: "text", text: question },
          { type: "image_url", image_url: { url: imageUrl } }
        ];
      }

      const completion = await openai.chat.completions.create({
        model: "google/gemini-2.5-pro-exp-03-25",
        messages: [{ role: "user", content }]
      });

      return new Response(
        JSON.stringify({ answer: completion.choices[0].message.content }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      lastError = error;
      retryCount++;

      if (error.status === 429) {
        if (retryCount < maxRetries) {
          // Exponential backoff: 2^retryCount seconds
          const backoffTime = Math.pow(2, retryCount) * 1000;
          await sleep(backoffTime);
          continue;
        }
      } else {
        // If it's not a rate limit error, don't retry
        break;
      }
    }
  }

  // If we get here, all retries failed
  return new Response(
    JSON.stringify({ 
      error: 'Failed to process request after multiple attempts',
      details: lastError?.message 
    }), 
    { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
});