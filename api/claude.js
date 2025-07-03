import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { messages, context, systemPrompt, model = 'claude-3-5-sonnet-20241022', max_tokens = 2000 } = req.body;
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      res.status(400).json({ error: { message: 'Valid Claude API key required' } });
      return;
    }

    console.log('Forwarding request to Claude API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens,
        system: systemPrompt || 'You are a helpful AI assistant.',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      res.status(response.status).json({ error: { message: errorText } });
      return;
    }

    const data = await response.json();
    console.log('Claude API response received');

    // Extract the response content and try to parse as JSON
    const content = data.content?.[0]?.text || '';

    try {
      // Try to parse as JSON first
      const parsedContent = JSON.parse(content);
      res.status(200).json(parsedContent);
    } catch {
      // If not JSON, return as plain response
      res.status(200).json({
        response: content,
        actions: [],
        insights: []
      });
    }

  } catch (error) {
    console.error('API handler error:', error);
    res.status(500).json({ 
      error: { 
        message: `Server error: ${error.message}` 
      } 
    });
  }
}