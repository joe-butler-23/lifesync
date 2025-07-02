import React from 'react';
import { 
  Calendar, 
  CheckSquare, 
  Utensils, 
  Dumbbell, 
  MessageCircle, 
  Settings, 
  Home, 
  BarChart3, 
  Target 
} from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
  const navigationItems = [
            { id: 'dashboard', label: 'Day Planner', icon: Home },
    { id: 'planner', label: 'Weekly Planner', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'claude', label: 'Claude Assistant', icon: MessageCircle }
  ];

  return (
    <div className="w-64 bg-gray-900 text-white p-4 flex flex-col">
      <div className="flex items-center mb-8">
        <div className="w-8 h-8 bg-blue-500 rounded-lg mr-3 flex items-center justify-center">
          <Target className="w-4 h-4" />
        </div>
        <h1 className="text-xl font-bold">LifeSync</h1>
      </div>
      
      <nav className="flex-1">
        <div className="space-y-2">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                activeView === item.id ? 'bg-blue-600' : 'hover:bg-gray-800'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
      
      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={() => setActiveView('settings')}
          className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
            activeView === 'settings' ? 'bg-blue-600' : 'hover:bg-gray-800'
          }`}
        >
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
