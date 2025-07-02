
export default async function handler(req, res) {
  console.log('Claude API handler called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, context, systemPrompt, model, max_tokens } = req.body;
  const apiKey = req.headers['x-api-key'];

  console.log('Request details:', {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none',
    messagesLength: messages?.length || 0,
    model: model
  });

  if (!apiKey) {
    console.log('No API key provided');
    return res.status(401).json({ 
      error: 'API key required',
      response: 'Please configure your Claude API key in Settings.',
      actions: [],
      insights: []
    });
  }

  if (!apiKey.startsWith('sk-ant-')) {
    console.log('Invalid API key format');
    return res.status(401).json({ 
      error: 'Invalid API key format',
      response: 'Please check your Claude API key format in Settings.',
      actions: [],
      insights: []
    });
  }

  try {
    console.log('Making request to Anthropic API...');
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-sonnet-20240229',
        max_tokens: max_tokens || 2000,
        system: systemPrompt,
        messages: messages
      })
    });

    console.log('Anthropic API response status:', anthropicResponse.status);

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      
      return res.status(anthropicResponse.status).json({ 
        error: `Anthropic API error: ${anthropicResponse.status}`,
        response: `API Error: ${errorData?.error?.message || 'Unknown error'}`,
        actions: [],
        insights: []
      });
    }

    const data = await anthropicResponse.json();
    console.log('Anthropic API response data keys:', Object.keys(data));
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('Invalid response structure from Anthropic:', data);
      return res.status(500).json({ 
        error: 'Invalid response from Anthropic',
        response: 'Received an unexpected response format from the AI service.',
        actions: [],
        insights: []
      });
    }

    // Try to parse JSON response from Claude
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(data.content[0].text);
      console.log('Successfully parsed JSON response');
    } catch (parseError) {
      console.log('Response is not JSON, treating as plain text:', parseError.message);
      // If not JSON, return as plain text response
      parsedResponse = {
        response: data.content[0].text,
        actions: [],
        insights: []
      };
    }

    console.log('Sending response to client');
    res.status(200).json(parsedResponse);
  } catch (error) {
    console.error('Claude API handler error:', error);
    res.status(500).json({ 
      error: 'Failed to communicate with Claude',
      response: 'I apologize, but I encountered an error. Please try again.',
      actions: [],
      insights: []
    });
  }
}
