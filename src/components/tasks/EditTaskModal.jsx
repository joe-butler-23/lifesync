import React, { useState } from 'react';

const EditTaskModal = ({ task, onClose, onSave }) => {
  const [content, setContent] = useState(task?.content || '');
  const [priority, setPriority] = useState(task?.priority || 1);
  const [dueDate, setDueDate] = useState(task?.due || '');

  const handleSave = () => {
    const updates = {
      content,
      priority,
      due_string: dueDate || null
    };
    onSave(task.id, updates);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Edit Task</h3>

        <div className="mb-4">
          <label htmlFor="taskContent" className="block text-gray-700 text-sm font-bold mb-2">
            Task Content
          </label>
          <input
            type="text"
            id="taskContent"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="taskPriority" className="block text-gray-700 text-sm font-bold mb-2">
            Priority (1-4, 4 is highest)
          </label>
          <input
            type="number"
            id="taskPriority"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value))}
            min="1"
            max="4"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="taskDueDate" className="block text-gray-700 text-sm font-bold mb-2">
            Due Date
          </label>
          <input
            type="date"
            id="taskDueDate"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
            onChange={(e) => setDueDate(e.target.value)}
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