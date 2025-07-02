import React, { useState } from 'react';

const EnhancedDateInput = ({ value, onChange, placeholder, mode, onModeChange }) => {
  const handleDateChange = (e) => {
    onChange(e.target.value);
  };

  const handleModeToggle = () => {
    onModeChange(mode === 'natural' ? 'picker' : 'natural');
  };

  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    if (mode === 'picker') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return dateValue;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-gray-700 text-sm font-bold">
          Due Date
        </label>
        <button
          type="button"
          onClick={handleModeToggle}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {mode === 'natural' ? 'Use Date Picker' : 'Use Natural Language'}
        </button>
      </div>
      
      {mode === 'natural' ? (
        <input
          type="text"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={value}
          onChange={handleDateChange}
          placeholder={placeholder || "e.g., today, tomorrow, next monday, 2024-12-31"}
        />
      ) : (
        <input
          type="date"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={formatDateForInput(value)}
          onChange={handleDateChange}
        />
      )}
      
      <div className="text-xs text-gray-500">
        {mode === 'natural' 
          ? 'Try: today, tomorrow, next monday, in 2 weeks, 2024-12-31'
          : 'Select a date from the calendar'
        }
      </div>
    </div>
  );
};

const formatDateForTodoist = (dateInput) => {
  if (!dateInput) return '';
  
  const naturalLanguage = ['today', 'tomorrow', 'next monday', 'next tuesday', 'next wednesday', 
                         'next thursday', 'next friday', 'next saturday', 'next sunday', 'next week', 
                         'next month', 'this weekend'];
  
  if (naturalLanguage.some(phrase => dateInput.toLowerCase().includes(phrase))) {
    return dateInput;
  }
  
  const date = new Date(dateInput);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return dateInput;
};

const EditTaskModal = ({ task, onClose, onSave }) => {
  const [editedContent, setEditedContent] = useState(task.content || task.title);
  const [editedPriority, setEditedPriority] = useState(task.priority);
  const [editedDueDate, setEditedDueDate] = useState(task.due || '');
  const [editDueDateMode, setEditDueDateMode] = useState('natural');

  const handleSave = () => {
    onSave(task.id, {
      content: editedContent,
      priority: editedPriority,
      due_string: formatDateForTodoist(editedDueDate),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Edit Todoist Task</h3>
        <div className="mb-4">
          <label htmlFor="editTaskContent" className="block text-gray-700 text-sm font-bold mb-2">Task Content</label>
          <input
            type="text"
            id="editTaskContent"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="e.g., Buy groceries"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="editTaskPriority" className="block text-gray-700 text-sm font-bold mb-2">Priority (1-4, 4 is highest)</label>
          <input
            type="number"
            id="editTaskPriority"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={editedPriority}
            onChange={(e) => setEditedPriority(parseInt(e.target.value))}
            min="1"
            max="4"
          />
        </div>
        <div className="mb-6">
          <EnhancedDateInput
            value={editedDueDate}
            onChange={setEditedDueDate}
            mode={editDueDateMode}
            onModeChange={setEditDueDateMode}
            placeholder="e.g., today, tomorrow, next monday"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;
