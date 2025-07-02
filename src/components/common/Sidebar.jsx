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
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg h-full flex flex-col transition-all duration-300 ease-in-out`}>
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-b flex items-center justify-between transition-all duration-300`}>
        <h1 className={`text-xl font-bold text-gray-900 transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
          Life Dashboard
        </h1>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 ${isCollapsed ? 'mx-auto' : ''}`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="relative w-5 h-5">
            <Menu className={`w-5 h-5 absolute transition-all duration-300 ${isCollapsed ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`} />
            <X className={`w-5 h-5 absolute transition-all duration-300 ${isCollapsed ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'}`} />
          </div>
        </button>
      </div>

      <nav className={`flex-1 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <ul className="space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 text-left rounded-lg transition-all duration-200 group relative ${
                    activeView === item.id
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 transition-all duration-200 ${!isCollapsed ? 'mr-3' : ''} ${
                    activeView === item.id ? 'text-blue-600' : 'group-hover:scale-110'
                  }`} />
                  <span className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                    {item.label}
                  </span>
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
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