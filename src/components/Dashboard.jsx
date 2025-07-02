import React from 'react';
import { Calendar, CheckSquare, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import DeepnotesEditor from 'deepnotes-editor';
import 'deepnotes-editor/dist/deepnotes-editor.css';

const Dashboard = ({
  selectedDate,
  setSelectedDate,
  showDatePicker,
  setShowDatePicker,
  tasks,
  getTasksForDate,
  scratchpadContent,
  setScratchpadContent,
  handleTaskCompletionToggle
}) => {
  const navigateDay = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const formatSelectedDate = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (selectedDate.toDateString() === today.toDateString()) return 'Today';
    if (selectedDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
    if (selectedDate.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const dayTasks = getTasksForDate(selectedDate);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex items-center justify-between">
          <button onClick={() => navigateDay(-1)} className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{formatSelectedDate()}</h1>
            <button onClick={() => setShowDatePicker(!showDatePicker)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Open date picker">
              <Calendar className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => navigateDay(1)} className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {showDatePicker && (
          <div className="mt-4 flex justify-center">
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => {
                setSelectedDate(new Date(e.target.value));
                setShowDatePicker(false);
              }}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <CheckSquare className="w-5 h-5 mr-2 text-blue-600" />
              Tasks
            </h3>
            <span className="text-sm text-gray-500">{dayTasks.length} tasks</span>
          </div>
          <div className="space-y-3 min-h-[200px] max-h-[300px] overflow-y-auto">
            {dayTasks.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <CheckSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No tasks for this day</p>
                </div>
              </div>
            ) : (
              dayTasks.map(task => (
                <div key={task.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      className="mr-3 mt-1 rounded"
                      checked={task.completed}
                      onChange={() => handleTaskCompletionToggle(task.id, task.completed)}
                    />
                    <div>
                      <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-blue-900'}`}>{task.content || task.title}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
              Scratchpad
            </h3>
            <span className="text-sm text-gray-500">Notes for {formatSelectedDate()}</span>
          </div>
          <div className="min-h-[200px] border rounded-lg p-4 bg-gray-50">
            <DeepnotesEditor
              content={scratchpadContent}
              onChange={setScratchpadContent}
              placeholder="Start typing your notes, ideas, or reminders..."
              className="min-h-[160px] w-full border-none bg-transparent focus:outline-none"
              style={{ lineHeight: 'normal', display: 'flex', alignItems: 'center' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
