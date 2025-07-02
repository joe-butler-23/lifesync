
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Users, Send, Lightbulb, Zap, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { useClaudeIntegration } from '../hooks/useClaudeIntegration';

const ClaudeAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm your AI assistant with deep integration into your Life Dashboard. I can help you with tasks, scheduling, meal planning, and productivity insights. I can see your current data and take actions on your behalf.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  
  const { askClaude } = useClaudeIntegration();

  const smartSuggestions = [
    "What should I focus on today?",
    "Help me plan this week's meals",
    "Analyze my task completion patterns",
    "Suggest a workout schedule",
    "What's overdue and needs attention?",
    "Plan my optimal daily routine",
    "Find gaps in my schedule for deep work",
    "Reorganize my tasks by priority"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message = inputValue) => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await askClaude(message);
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.response,
        actions: response.actions || [],
        insights: response.insights || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const MessageComponent = ({ message }) => (
    <div className={`flex items-start space-x-3 mb-6 ${message.type === 'user' ? 'justify-end' : ''}`}>
      {message.type === 'assistant' && (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-[70%] ${message.type === 'user' ? 'order-2' : ''}`}>
        <div className={`rounded-lg p-4 ${
          message.type === 'user' 
            ? 'bg-blue-600 text-white ml-auto' 
            : 'bg-gray-50 text-gray-900'
        }`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
          
          {message.actions && message.actions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Zap className="w-4 h-4 mr-1" />
                Actions taken:
              </div>
              <div className="space-y-1">
                {message.actions.map((action, index) => (
                  <div key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {action.type}: {JSON.stringify(action.payload)}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {message.insights && message.insights.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Lightbulb className="w-4 h-4 mr-1" />
                Insights:
              </div>
              <ul className="text-sm space-y-1">
                {message.insights.map((insight, index) => (
                  <li key={index} className="text-gray-700">• {insight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
      
      {message.type === 'user' && (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center order-1">
          <Users className="w-4 h-4 text-gray-600" />
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 h-full flex flex-col max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Assistant</h2>
          <p className="text-sm text-gray-600">Deeply integrated with your Life Dashboard</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>AI Ready</span>
        </div>
      </div>

      {/* Smart Suggestions */}
      {showSuggestions && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
              Smart Suggestions
            </h3>
            <button 
              onClick={() => setShowSuggestions(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {smartSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(suggestion)}
                className="text-left p-2 text-sm bg-white rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors border"
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {!showSuggestions && (
        <button
          onClick={() => setShowSuggestions(true)}
          className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
        >
          <ChevronDown className="w-4 h-4 mr-1" />
          Show suggestions
        </button>
      )}

      {/* Messages */}
      <div className="flex-1 bg-white rounded-xl border overflow-y-auto p-6 mb-6">
        {messages.map((message) => (
          <MessageComponent key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-sm text-gray-600 ml-2">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your schedule, tasks, or planning. I can analyze your data and take actions for you..."
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows="3"
            disabled={isLoading}
          />
        </div>
        <button 
          onClick={() => handleSendMessage()}
          disabled={!inputValue.trim() || isLoading}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ClaudeAssistant;
