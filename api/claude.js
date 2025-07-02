
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, context, systemPrompt, model, max_tokens } = req.body;
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key required',
      response: 'Please configure your Claude API key in Settings.',
      actions: [],
      insights: []
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Anthropic API error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Try to parse JSON response from Claude
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(data.content[0].text);
    } catch {
      // If not JSON, return as plain text response
      parsedResponse = {
        response: data.content[0].text,
        actions: [],
        insights: []
      };
    }

    res.status(200).json(parsedResponse);
  } catch (error) {
    console.error('Claude API error:', error);
    res.status(500).json({ 
      error: 'Failed to communicate with Claude',
      response: 'I apologize, but I encountered an error. Please try again.',
      actions: [],
      insights: []
    });
  }
}
