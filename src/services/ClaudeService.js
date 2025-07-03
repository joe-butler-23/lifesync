
class ClaudeService {
  constructor() {
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  getApiKey() {
    return localStorage.getItem('claude_api_key') || process.env.REACT_APP_ANTHROPIC_API_KEY;
  }

  async sendMessage(messages, context = {}, systemPrompt = '') {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      throw new Error('Claude API key not configured. Please add your API key in Settings.');
    }

    if (!apiKey.startsWith('sk-ant-')) {
      throw new Error('Invalid Claude API key format. Please check your API key in Settings.');
    }

    try {
      console.log('Sending request to Claude API...');
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          messages: messages,
          context: context,
          systemPrompt: systemPrompt,
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000
        })
      });

      console.log('Claude API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }
        throw new Error(`Claude API error: ${response.status} - ${errorData?.error?.message || errorData?.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Claude API response data:', data);
      
      if (!data || Object.keys(data).length === 0) {
        throw new Error('Received empty response from Claude API');
      }
      
      return data;
    } catch (error) {
      console.error('Claude service error:', error);
      throw error;
    }
  }

  async analyzeAppState(appState, userQuery) {
    const systemPrompt = `You are an AI assistant deeply integrated with a Life Dashboard app. You can:

1. Read and analyze the complete app state
2. Suggest actions to take based on user requests
3. Help with task management, calendar events, meal planning, and workouts
4. Provide insights about productivity and scheduling

App capabilities:
- Todoist task management
- Google Calendar integration  
- Weekly planning with drag & drop
- Daily dashboard view
- Recipe and workout scheduling
- Scratchpad notes with outliner

Always respond with JSON containing:
{
  "response": "Natural language response to user",
  "actions": [
    {
      "type": "ACTION_TYPE",
      "payload": {...}
    }
  ],
  "insights": ["Optional insights about the user's data"]
}

Available action types:
- NAVIGATE: { "view": "dashboard|planner|tasks|claude|settings" } (only use when user explicitly requests to go to a different view)
- UPDATE_TASK: { "taskId": "id", "updates": {...} }
- ADD_TASK: { "content": "text", "dueDate": "date", "priority": 1-4 }
- SCHEDULE_RECIPE: { "recipeId": "id", "date": "YYYY-MM-DD", "mealType": "lunch|dinner" }
- SCHEDULE_WORKOUT: { "workoutId": "id", "date": "YYYY-MM-DD" }
- UPDATE_SCRATCHPAD: { "content": "text", "date": "YYYY-MM-DD" }
- SET_DATE: { "date": "YYYY-MM-DD" }
- APPLY_FILTER: { "filterType": "tasks|day", "filter": "filter_name" }

Important: Do NOT include NAVIGATE actions unless the user specifically asks to go to a different view. Users asking general questions should stay in the current view.`;

    const messages = [
      {
        role: 'user',
        content: `Current app state: ${JSON.stringify(appState, null, 2)}

User request: "${userQuery}"`
      }
    ];

    return await this.sendMessage(messages, appState, systemPrompt);
  }

  async getContextualHelp(component, componentState, userQuery) {
    const systemPrompt = `You are providing contextual help for the ${component} component of a Life Dashboard app. 
    
Analyze the component state and provide specific, actionable guidance.`;

    const messages = [
      {
        role: 'user',
        content: `Component: ${component}
State: ${JSON.stringify(componentState, null, 2)}
User question: "${userQuery}"`
      }
    ];

    return await this.sendMessage(messages, { component, componentState }, systemPrompt);
  }
}

const claudeServiceInstance = new ClaudeService();
export default claudeServiceInstance;
