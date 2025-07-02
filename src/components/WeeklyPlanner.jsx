import React from 'react';
import { CheckSquare } from 'lucide-react';
import { formatWeekRange } from '../utils/dateUtils';

const WeeklyPlanner = ({
  currentWeekStart,
  navigateWeek,
  weekDates,
  getTasksForDate
}) => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek(-1)}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Previous Week
          </button>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">{formatWeekRange(currentWeekStart)}</h2>
          </div>
          <button
            onClick={() => navigateWeek(1)}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Next Week
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {weekDates.map(date => {
          const tasks = getTasksForDate(date);
          return (
            <div key={date.toISOString()} className="bg-white rounded-lg p-3 space-y-2 shadow-sm border">
              <h3 className="text-sm font-semibold text-gray-900 text-center">
                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </h3>
              <div className="space-y-1">
                {tasks.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center">No tasks</p>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className="flex items-center text-xs bg-gray-50 rounded px-2 py-1">
                      <CheckSquare className="w-3 h-3 mr-1" />
                      <span className="truncate">{task.content || task.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyPlanner;
