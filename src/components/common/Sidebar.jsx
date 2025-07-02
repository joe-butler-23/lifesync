import React from 'react';
import { Calendar, CheckSquare, MessageCircle, Settings, BarChart3, Menu, X } from 'lucide-react';

const Sidebar = ({ activeView, setActiveView, isCollapsed, setIsCollapsed }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'planner', label: 'Weekly Planner', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'claude', label: 'Claude Assistant', icon: MessageCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg h-full flex flex-col transition-all duration-300`}>
      <div className="p-6 border-b flex items-center justify-between">
        {!isCollapsed && <h1 className="text-xl font-bold text-gray-900">Life Dashboard</h1>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 text-left rounded-lg transition-colors ${
                    activeView === item.id
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 ${!isCollapsed ? 'mr-3' : ''}`} />
                  {!isCollapsed && item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;