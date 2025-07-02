import React from 'react';
import { Plus } from 'lucide-react';
import EnhancedDateInput from './EnhancedDateInput';
import { getFilteredTasks, getSortedTasks, getGroupedTasks, toggleFilter } from '../utils/taskUtils';
import { isTaskOverdue, isTaskDueToday, isTaskDueThisWeek } from '../utils/dateUtils';

const TasksView = (props) => {
  const {
    tasks,
    todoistToken,
    loadingTodoistTasks,
    todoistError,
    fetchTodoistTasks,
    setShowAddTaskModal,
    showAddTaskModal,
    newTaskContent,
    setNewTaskContent,
    newTaskPriority,
    setNewTaskPriority,
    newTaskDueDate,
    setNewTaskDueDate,
    newTaskDueDateMode,
    setNewTaskDueDateMode,
    handleAddTask,
    handleDeleteTask,
    handleTaskCompletionToggle,
    setEditingTask,
    setShowEditTaskModal,
    activeFilters,
    setActiveFilters,
    sortBy,
    setSortBy,
    groupBy,
    setGroupBy,
    selectedProjects,
    setSelectedProjects,
    availableProjects
  } = props;

  const filteredTasks = getFilteredTasks(tasks, activeFilters, selectedProjects);
  const sortedTasks = getSortedTasks(filteredTasks, sortBy);
  const groupedTasks = getGroupedTasks(sortedTasks, groupBy);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchTodoistTasks(todoistToken)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            disabled={loadingTodoistTasks}
          >
            {loadingTodoistTasks ? 'Syncing...' : 'Sync Now'}
          </button>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Add Task
          </button>
        </div>
      </div>

      {/* Filter, Sort, and Group Controls */}
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Sort Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Default Order</option>
              <option value="date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>

          {/* Group Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">No Grouping</option>
              <option value="date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="project">Project</option>
              <option value="label">Label</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-700 mb-2 block">Quick Filters:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', count: tasks.filter(t => !t.project_name || t.project_name.toLowerCase() !== 'shopping list').length },
                { key: 'today', label: 'Today', count: tasks.filter(t => isTaskDueToday(t)).length },
                { key: 'week', label: 'This Week', count: tasks.filter(t => isTaskDueThisWeek(t)).length },
                { key: 'overdue', label: 'Overdue', count: tasks.filter(t => isTaskOverdue(t)).length },
                { key: 'bridge_club', label: 'Bridge Club', count: tasks.filter(t => t.project_name && t.project_name.toLowerCase().includes('bridge club')).length },
                { key: 'home', label: 'Home', count: tasks.filter(t => t.project_name && t.project_name.toLowerCase() === 'home').length },
                { key: 'cooking', label: 'Cooking', count: tasks.filter(t => t.project_name && t.project_name.toLowerCase() === 'meal_planning').length }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={(e) => toggleFilter(filter.key, e)}
                  className={`px-2 py-1 rounded-full text-xs transition-colors ${
                    activeFilters.has(filter.key)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(activeFilters.size > 1 || selectedProjects.size > 0) && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                <button
                  onClick={() => {
                    setActiveFilters(new Set(['all']));
                    setSelectedProjects(new Set());
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {Array.from(activeFilters).filter(f => f !== 'all').map(filter => (
                  <span key={filter} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {filter}
                  </span>
                ))}
                {Array.from(selectedProjects).map(projectId => (
                  <span key={projectId} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    {availableProjects.find(p => p.id === projectId)?.name || projectId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Groups */}
      <div className="space-y-6">
        {loadingTodoistTasks && <p>Loading tasks...</p>}
        {todoistError && <p className="text-red-500">Error: {todoistError.message}</p>}
        {!loadingTodoistTasks && tasks.length === 0 && !todoistError && (
          <p className="text-gray-600">No tasks found. Add a new task or check your Todoist integration settings.</p>
        )}

        {!loadingTodoistTasks && tasks.length > 0 && Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
          <div key={groupName} className="space-y-3">
            {groupBy !== 'none' && (
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">{groupName}</h3>
                <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {groupTasks.length}
                </span>
              </div>
            )}

            {groupTasks.map(task => (
              <div key={task.id} className="bg-white rounded-xl p-4 shadow-sm border flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-3 rounded"
                    checked={task.completed}
                    onChange={() => handleTaskCompletionToggle(task.id, task.completed)}
                  />
                  <div>
                    <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.content || task.title}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                      {task.priority && (
                        <span className={`px-2 py-1 rounded-full ${
                          task.priority === 4 ? 'bg-red-100 text-red-600' :
                          task.priority === 3 ? 'bg-yellow-100 text-yellow-600' :
                          task.priority === 2 ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>P{task.priority}</span>
                      )}
                      {task.project_name && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                          {task.project_name.toLowerCase().includes('bridge club') ? 'Bridge Club' : task.project_name}
                        </span>
                      )}
                      {task.labels && task.labels.length > 0 && task.labels.map(label => (
                        <span key={label} className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
                          @{label}
                        </span>
                      ))}
                      {task.due && (
                        <span className={`px-2 py-1 rounded-full ${
                          isTaskOverdue(task) ? 'bg-red-100 text-red-600' :
                          isTaskDueToday(task) ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {isTaskDueToday(task) ? 'Today' : isTaskOverdue(task) ? 'Overdue' : new Date(task.due).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {task.source === 'todoist' && (
                    <>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 rounded-full hover:bg-gray-200 text-red-500"
                        title="Delete Task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setShowEditTaskModal(true);
                        }}
                        className="p-1 rounded-full hover:bg-gray-200 text-blue-500"
                        title="Edit Task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M22 13.0476V22H2V2h10.0476"/><path d="M17.477 3.35146 14.07 6.75841"/><path d="M14.07 6.75841 12.042 4.73045"/><path d="M12.042 4.73045 15.449 1.3235"/><path d="M15.449 1.3235 17.477 3.35146"/><path d="M17.477 3.35146 20.884 6.75841"/><path d="M20.884 6.75841 18.856 8.78637"/><path d="M18.856 8.78637 15.449 5.37941"/><path d="M15.449 5.37941 17.477 3.35146Z"/></svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {showAddTaskModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add New Todoist Task</h3>
            <div className="mb-4">
              <label htmlFor="taskContent" className="block text-gray-700 text-sm font-bold mb-2">Task Content</label>
              <input
                type="text"
                id="taskContent"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.target.value)}
                placeholder="e.g., Buy groceries"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="taskPriority" className="block text-gray-700 text-sm font-bold mb-2">Priority (1-4, 4 is highest)</label>
              <input
                type="number"
                id="taskPriority"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(parseInt(e.target.value))}
                min="1"
                max="4"
              />
            </div>
            <div className="mb-6">
              <EnhancedDateInput
                value={newTaskDueDate}
                onChange={setNewTaskDueDate}
                mode={newTaskDueDateMode}
                onModeChange={setNewTaskDueDateMode}
                placeholder="e.g., today, tomorrow, next monday"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksView;
