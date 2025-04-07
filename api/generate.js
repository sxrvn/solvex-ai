export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, image } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Get API key from environment variables
    const apiKey = process.env.VITE_ROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('API key is missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Prepare the request body for the API
    const content = image 
      ? [
          { type: "text", text: question },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${image}`
            }
          }
        ] 
      : question;

    // Make the request to the API
    const response = await fetch('https://router.requesty.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro-exp-03-25",
        messages: [{
          role: "user",
          content
        }]
      })
    });

    // Handle API errors
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `API error: ${response.status}` 
      });
    }

    // Return the API response
    const data = await response.json();
    return res.status(200).json({ 
      content: data.choices[0].message.content 
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request' 
    });
  }
} 