
import React, { useState } from 'react';
import { Brain, X } from 'lucide-react';
// import { useClaudeIntegration } from '../hooks/useClaudeIntegration';

const ClaudeButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
      >
        <Brain className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ClaudeButton;

const ClaudeButton = ({ 
  component, 
  componentState = {}, 
  className = "",
  size = "sm" 
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [helpResponse, setHelpResponse] = useState(null);
  const { getContextualHelp } = useClaudeIntegration();

  const handleGetHelp = async () => {
    setIsLoading(true);
    try {
      const response = await getContextualHelp(
        component, 
        componentState, 
        "How can I best use this part of the app? What are some tips and insights based on my current data?"
      );
      setHelpResponse(response);
      setShowHelp(true);
    } catch (error) {
      console.error('Contextual help error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <>
      <button
        onClick={handleGetHelp}
        disabled={isLoading}
        className={`${buttonSize} bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl ${className}`}
        title="Get AI help for this section"
      >
        {isLoading ? (
          <div className={`${iconSize} border-2 border-white border-t-transparent rounded-full animate-spin`} />
        ) : (
          <Brain className={iconSize} />
        )}
      </button>

      {showHelp && helpResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-blue-600" />
                  AI Help: {component}
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{helpResponse.response}</p>
                
                {helpResponse.insights && helpResponse.insights.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">💡 Insights:</h4>
                    <ul className="space-y-1">
                      {helpResponse.insights.map((insight, index) => (
                        <li key={index} className="text-blue-800 text-sm">• {insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowHelp(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClaudeButton;
