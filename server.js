
const express = require('express');
const path = require('path');

// Handle fetch for Node.js compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-api-key');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Serve static files from React build directory
app.use(express.static(path.join(__dirname, 'build')));

// Check if build directory exists
const buildPath = path.join(__dirname, 'build');
if (!require('fs').existsSync(buildPath)) {
  console.warn('Build directory not found. Make sure to run "npm run build" first.');
}

// Claude API proxy endpoint
app.post('/api/claude', async (req, res) => {
  try {
    const { messages, model = 'claude-3-5-sonnet-20241022', max_tokens = 2000 } = req.body;
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      return res.status(400).json({ 
        error: { message: 'Valid Claude API key required' } 
      });
    }

    console.log('Making request to Claude API...');

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
        system: 'You are a helpful AI assistant.',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      return res.status(response.status).json({ 
        error: { message: errorText } 
      });
    }

    const data = await response.json();
    console.log('Claude API response received');

    const content = data.content?.[0]?.text || '';
    
    try {
      const parsedContent = JSON.parse(content);
      res.json(parsedContent);
    } catch {
      res.json({ 
        response: content, 
        actions: [], 
        insights: [] 
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: { message: `Server error: ${error.message}` } 
    });
  }
});

// Handle React routing - serve index.html for all other requests
// Using a function that bypasses path-to-regexp entirely
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/static/')) {
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
  } else {
    next();
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server accessible at http://0.0.0.0:${PORT}`);
});
