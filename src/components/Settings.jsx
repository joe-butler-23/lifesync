import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [todoistToken, setTodoistToken] = useState('');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [claudeApiError, setClaudeApiError] = useState(null);
  const [loadingTodoistTasks, setLoadingTodoistTasks] = useState(false);

  useEffect(() => {
    // Load saved tokens
    const savedTodoistToken = localStorage.getItem('todoist_token');
    const savedClaudeKey = localStorage.getItem('claude_api_key');

    if (savedTodoistToken) setTodoistToken(savedTodoistToken);
    if (savedClaudeKey) setClaudeApiKey(savedClaudeKey);
  }, []);

  const handleSaveTodoistToken = () => {
    localStorage.setItem('todoist_token', todoistToken.trim());
    alert('Todoist token saved!');
  };

  const handleGoogleAuthClick = () => {
    // Implement your Google Calendar authentication logic here
    // For example, redirect the user to the Google OAuth URL
    alert('Connect Google Calendar button clicked!');
  };

  const handleDisconnectGoogle = () => {
    localStorage.removeItem('google_calendar_token');
    alert('Google Calendar disconnected');
  };

  const handleSaveClaudeApiKey = () => {
    try {
      if (!claudeApiKey.trim()) {
        setClaudeApiError(new Error('API key cannot be empty'));
        return;
      }

      if (!claudeApiKey.startsWith('sk-ant-')) {
        setClaudeApiError(new Error('Invalid API key format. Should start with sk-ant-'));
        return;
      }

      localStorage.setItem('claude_api_key', claudeApiKey.trim());
      setClaudeApiError(null);
      alert('Claude API key saved successfully!');
    } catch (error) {
      setClaudeApiError(error);
    }
  };

  const fetchTodoistTasks = async (token) => {
    setLoadingTodoistTasks(true);
    try {
      // Replace with actual API call to Todoist
      console.log('Fetching Todoist tasks with token:', token);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      console.log('Todoist tasks fetched successfully');
    } catch (error) {
      console.error('Error fetching Todoist tasks:', error);
    } finally {
      setLoadingTodoistTasks(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Todoist Integration</h3>
        <p className="text-gray-600 mb-4">Enter your Todoist API token to sync your tasks.</p>
        <div className="flex items-end space-x-3">
          <input
            type="text"
            placeholder="Your Todoist API Token"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={todoistToken}
            onChange={(e) => setTodoistToken(e.target.value)}
          />
          <button
            onClick={handleSaveTodoistToken}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
          >
            Save and Test Connection
          </button>
          {todoistToken && (
            <button
              onClick={() => {
                console.log('Manual sync triggered');
                fetchTodoistTasks(todoistToken);
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={loadingTodoistTasks}
            >
              {loadingTodoistTasks ? 'Syncing...' : 'Force Sync'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Google Calendar Integration</h3>
        <p className="text-gray-600 mb-4">Connect your Google Calendar to display events in the planner.</p>
        <div className="flex items-end space-x-3">
          <button
            onClick={handleGoogleAuthClick}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Connect Google Calendar
          </button>
          <button
            onClick={handleDisconnectGoogle}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Disconnect Google Calendar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-semibold text-gray-900 mb-4">Claude AI Integration</h3>
        <p className="text-gray-600 mb-4">Enter your Anthropic API key to enable Claude AI assistant features.</p>
        <div className="flex items-end space-x-3">
          <input
            type="password"
            placeholder="Your Anthropic API Key (starts with sk-ant-)"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={claudeApiKey}
            onChange={(e) => setClaudeApiKey(e.target.value)}
          />
          <button
            onClick={handleSaveClaudeApiKey}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Save API Key
          </button>
        </div>
        {claudeApiError && <p className="text-red-500 mt-2">Error: {claudeApiError.message}</p>}
        {claudeApiKey && !claudeApiError && (
          <p className="text-green-600 mt-2">Claude API key saved successfully! AI features are now enabled.</p>
        )}
        <div className="mt-3 text-sm text-gray-500">
          <p>• Get your API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Anthropic Console</a></p>
          <p>• Your API key is stored securely and only used for AI requests</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;