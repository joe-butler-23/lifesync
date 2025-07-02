import React from 'react';
import { MessageCircle, Users } from 'lucide-react';

const ClaudeAssistant = () => (
  <div className="p-6 h-full flex flex-col">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Claude Assistant</h2>
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Online</span>
      </div>
    </div>

    <div className="flex-1 bg-white rounded-xl border p-4 mb-6 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-gray-900">Hello! I'm your Claude assistant. I can help you with:</p>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Planning your weekly schedule and optimizing your time</li>
              <li>Suggesting recipes based on your dietary preferences</li>
              <li>Creating workout plans and tracking fitness goals</li>
              <li>Managing tasks and setting reminders</li>
              <li>Analyzing your habits and providing insights</li>
            </ul>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-3">
            <p className="text-gray-900">Can you suggest a healthy meal plan for this week that takes less than 30 minutes to prepare?</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-gray-900">I'd be happy to help! Based on your recipe app data, here are some quick, healthy options:</p>
            <div className="mt-2 space-y-2">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-900">Monday: Chicken Teriyaki Bowl</p>
                <p className="text-sm text-blue-600">25 min • 420 cal • High protein</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-900">Tuesday: Salmon & Quinoa</p>
                <p className="text-sm text-blue-600">30 min • 380 cal • Omega-3 rich</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">Would you like me to add these to your weekly planner?</p>
          </div>
        </div>
      </div>
    </div>

    <div className="flex items-center space-x-3">
      <input
        type="text"
        placeholder="Ask Claude anything about your schedule, workouts, or nutrition..."
        className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Send
      </button>
    </div>
  </div>
);

export default ClaudeAssistant;
