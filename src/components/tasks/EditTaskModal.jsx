import React, { useState, useEffect } from "react";
import EnhancedDateInput from "../EnhancedDateInput";

const EditTaskModal = ({
  task,
  isOpen = true,
  onClose,
  onSave,
  onDelete,
  availableProjects = [],
}) => {
  const [taskContent, setTaskContent] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState(1);
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskDueDateMode, setTaskDueDateMode] = useState("natural");
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskLabels, setTaskLabels] = useState("");

  useEffect(() => {
    if (task) {
      setTaskContent(task.content || "");
      setTaskDescription(task.description || "");
      setTaskPriority(task.priority || 1);
      setTaskDueDate(task.due || "");
      setTaskProjectId(task.project_id || "");
      setTaskLabels(task.labels ? task.labels.join(", ") : "");
    }
  }, [task]);

  const handleSave = () => {
    const updates = {
      content: taskContent,
      description: taskDescription,
      priority: taskPriority,
      due_string: taskDueDate || null,
      project_id: taskProjectId || null,
      labels: taskLabels
        ? taskLabels.split(",").map((label) => label.trim())
        : [],
    };
    onSave(task.id, updates);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Edit Task</h3>

        <div className="mb-4">
          <label
            htmlFor="taskContent"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Task Title
          </label>
          <input
            type="text"
            id="taskContent"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={taskContent}
            onChange={(e) => setTaskContent(e.target.value)}
            placeholder="Task title"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="taskDescription"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Description
          </label>
          <textarea
            id="taskDescription"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Task description"
            rows="3"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="taskPriority"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Priority (1-4, 4 is highest)
          </label>
          <input
            type="number"
            id="taskPriority"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={taskPriority}
            onChange={(e) => setTaskPriority(parseInt(e.target.value))}
            min="1"
            max="4"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="taskDueDate"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Due Date
          </label>
          <EnhancedDateInput
            id="taskDueDate"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={taskDueDate}
            onChange={(date) => setTaskDueDate(date)}
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="taskProjectId"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Project
          </label>
          <select
            id="taskProjectId"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={taskProjectId}
            onChange={(e) => setTaskProjectId(e.target.value)}
          >
            <option value="">No Project</option>
            {availableProjects &&
              availableProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="taskLabels"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Labels (comma separated)
          </label>
          <input
            type="text"
            id="taskLabels"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={taskLabels}
            onChange={(e) => setTaskLabels(e.target.value)}
            placeholder="Enter labels separated by commas"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          {onDelete && (
            <button
              onClick={() => {
                onDelete(task.id);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Delete
            </button>
          )}
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