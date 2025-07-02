import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  SortAsc,
  X,
  ChevronDown,
  Calendar,
  Flag,
  Folder,
  Tag,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import EnhancedDateInput from "./EnhancedDateInput";
import {
  getFilteredTasks,
  getSortedTasks,
  getGroupedTasks,
  toggleFilter,
  searchTasks,
} from "../utils/taskUtils";
import {
  isTaskOverdue,
  isTaskDueToday,
  isTaskDueThisWeek,
} from "../utils/dateUtils";

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
    availableProjects,
  } = props;

  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState(new Set());
  const [priorityFilter, setPriorityFilter] = useState([]);

  const filteredTasks = useMemo(() => {
    let filtered = getFilteredTasks(tasks, activeFilters, selectedProjects);

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchTasks(filtered, searchQuery);
    }

    // Apply priority filter
    if (priorityFilter.length > 0) {
      filtered = filtered.filter((task) =>
        priorityFilter.includes(task.priority),
      );
    }

    // Apply label filter
    if (selectedLabels.size > 0) {
      filtered = filtered.filter(
        (task) =>
          task.labels && task.labels.some((label) => selectedLabels.has(label)),
      );
    }

    return filtered;
  }, [
    tasks,
    activeFilters,
    selectedProjects,
    searchQuery,
    priorityFilter,
    selectedLabels,
  ]);

  const sortedTasks = getSortedTasks(filteredTasks, sortBy);
  const groupedTasks = getGroupedTasks(sortedTasks, groupBy);

  const availableLabels = useMemo(() => {
    const labels = new Set();
    tasks.forEach((task) => {
      if (task.labels) {
        task.labels.forEach((label) => labels.add(label));
      }
    });
    return Array.from(labels);
  }, [tasks]);

  const quickFilters = [
    {
      key: "all",
      label: "All",
      icon: MoreHorizontal,
      count: tasks.filter(
        (t) =>
          !t.project_name || t.project_name.toLowerCase() !== "shopping list",
      ).length,
    },
    {
      key: "today",
      label: "Today",
      icon: Clock,
      count: tasks.filter((t) => isTaskDueToday(t)).length,
    },
    {
      key: "week",
      label: "This Week",
      icon: Calendar,
      count: tasks.filter((t) => isTaskDueThisWeek(t)).length,
    },
    {
      key: "overdue",
      label: "Overdue",
      icon: Flag,
      count: tasks.filter((t) => isTaskOverdue(t)).length,
    },
    {
      key: "bridge_club",
      label: "Bridge Club",
      icon: Folder,
      count: tasks.filter(
        (t) =>
          t.project_name &&
          t.project_name.toLowerCase().includes("bridge club"),
      ).length,
    },
    {
      key: "home",
      label: "Home",
      icon: Folder,
      count: tasks.filter(
        (t) => t.project_name && t.project_name.toLowerCase() === "home",
      ).length,
    },
    {
      key: "cooking",
      label: "Cooking",
      icon: Folder,
      count: tasks.filter(
        (t) =>
          t.project_name && t.project_name.toLowerCase() === "meal_planning",
      ).length,
    },
  ];

  const handleRemoveFilter = (filterType, value) => {
    if (filterType === "quick") {
      const newFilters = new Set(activeFilters);
      newFilters.delete(value);
      if (newFilters.size === 0) newFilters.add("all");
      setActiveFilters(newFilters);
    } else if (filterType === "project") {
      const newProjects = new Set(selectedProjects);
      newProjects.delete(value);
      setSelectedProjects(newProjects);
    } else if (filterType === "label") {
      const newLabels = new Set(selectedLabels);
      newLabels.delete(value);
      setSelectedLabels(newLabels);
    } else if (filterType === "priority") {
      setPriorityFilter(priorityFilter.filter((p) => p !== value));
    }
  };

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
            {loadingTodoistTasks ? "Syncing..." : "Sync Now"}
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

      {/* Simple Filter Interface */}
      <div className="bg-white rounded-xl border shadow-sm mb-6">
        {/* Always Visible Top Bar */}
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Sort & Group */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Default Order</option>
                <option value="date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="alphabetical">Alphabetical</option>
              </select>

              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">No Grouping</option>
                <option value="date">By Date</option>
                <option value="priority">By Priority</option>
                <option value="project">By Project</option>
                <option value="label">By Label</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Presets */}
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilters.has(filter.key);
              return (
                <button
                  key={filter.key}
                  onClick={(e) =>
                    toggleFilter(
                      filter.key,
                      activeFilters,
                      setActiveFilters,
                      setSelectedProjects,
                      e,
                    )
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {filter.label}
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                      isActive
                        ? "bg-blue-500 text-blue-100"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Filters Accordion */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">
                Advanced Filters
              </span>
              {(priorityFilter.length > 0 || selectedLabels.size > 0) && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                  {priorityFilter.length + selectedLabels.size} active
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform ${
                showAdvancedFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {showAdvancedFilters && (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="space-y-6">
                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Filter by Priority
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[4, 3, 2, 1].map((priority) => (
                      <button
                        key={priority}
                        onClick={() => {
                          const newPriorities = priorityFilter.includes(
                            priority,
                          )
                            ? priorityFilter.filter((p) => p !== priority)
                            : [...priorityFilter, priority];
                          setPriorityFilter(newPriorities);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          priorityFilter.includes(priority)
                            ? priority === 4
                              ? "bg-red-100 text-red-700 border-2 border-red-300"
                              : priority === 3
                                ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
                                : priority === 2
                                  ? "bg-green-100 text-green-700 border-2 border-green-300"
                                  : "bg-gray-100 text-gray-700 border-2 border-gray-300"
                            : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <Flag className="w-3.5 h-3.5" />
                        Priority {priority}
                        {priority === 4 && (
                          <span className="text-xs">(Urgent)</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Labels Filter */}
                {availableLabels.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Filter by Labels
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableLabels.map((label) => (
                        <button
                          key={label}
                          onClick={() => {
                            const newLabels = new Set(selectedLabels);
                            if (newLabels.has(label)) {
                              newLabels.delete(label);
                            } else {
                              newLabels.add(label);
                            }
                            setSelectedLabels(newLabels);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedLabels.has(label)
                              ? "bg-purple-100 text-purple-700 border-2 border-purple-300"
                              : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <Tag className="w-3.5 h-3.5" />@{label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects Filter */}
                {availableProjects.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Filter by Projects
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableProjects.slice(0, 8).map((project) => (
                        <button
                          key={project.id}
                          onClick={() => {
                            const newProjects = new Set(selectedProjects);
                            if (newProjects.has(project.id)) {
                              newProjects.delete(project.id);
                            } else {
                              newProjects.add(project.id);
                            }
                            setSelectedProjects(newProjects);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedProjects.has(project.id)
                              ? "bg-green-100 text-green-700 border-2 border-green-300"
                              : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <Folder className="w-3.5 h-3.5" />
                          {project.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear All Advanced Filters */}
                {(priorityFilter.length > 0 ||
                  selectedLabels.size > 0 ||
                  selectedProjects.size > 0) && (
                  <div className="pt-4 border-t border-gray-300">
                    <button
                      onClick={() => {
                        setPriorityFilter([]);
                        setSelectedLabels(new Set());
                        setSelectedProjects(new Set());
                      }}
                      className="text-sm text-red-600 hover:text-red-800 font-medium underline"
                    >
                      Clear all advanced filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {(Array.from(activeFilters).filter((f) => f !== "all").length > 0 ||
          selectedProjects.size > 0 ||
          priorityFilter.length > 0 ||
          selectedLabels.size > 0 ||
          searchQuery.trim()) && (
          <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">
                Showing {filteredTasks.length} of {tasks.length} tasks
              </span>
              <button
                onClick={() => {
                  setActiveFilters(new Set(["all"]));
                  setSelectedProjects(new Set());
                  setPriorityFilter([]);
                  setSelectedLabels(new Set());
                  setSearchQuery("");
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </button>
            </div>
            {(Array.from(activeFilters).filter((f) => f !== "all").length > 0 ||
              selectedProjects.size > 0 ||
              priorityFilter.length > 0 ||
              selectedLabels.size > 0 ||
              searchQuery.trim()) && (
              <div className="flex flex-wrap gap-1">
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-300 text-blue-800 rounded text-xs">
                    <Search className="w-3 h-3" />"{searchQuery}"
                  </span>
                )}
                {Array.from(activeFilters)
                  .filter((f) => f !== "all")
                  .map((filter) => (
                    <span
                      key={filter}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-300 text-blue-800 rounded text-xs"
                    >
                      {filter}
                    </span>
                  ))}
                {priorityFilter.map((priority) => (
                  <span
                    key={priority}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-300 text-blue-800 rounded text-xs"
                  >
                    P{priority}
                  </span>
                ))}
                {Array.from(selectedLabels).map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-300 text-blue-800 rounded text-xs"
                  >
                    @{label}
                  </span>
                ))}
                {Array.from(selectedProjects).map((projectId) => (
                  <span
                    key={projectId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-300 text-blue-800 rounded text-xs"
                  >
                    {availableProjects.find((p) => p.id === projectId)?.name ||
                      projectId}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Groups */}
      <div className="space-y-6">
        {loadingTodoistTasks && <p>Loading tasks...</p>}
        {todoistError && (
          <p className="text-red-500">Error: {todoistError.message}</p>
        )}
        {!loadingTodoistTasks && tasks.length === 0 && !todoistError && (
          <p className="text-gray-600">
            No tasks found. Add a new task or check your Todoist integration
            settings.
          </p>
        )}

        {!loadingTodoistTasks &&
          tasks.length > 0 &&
          Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
            <div key={groupName} className="space-y-3">
              {groupBy !== "none" && (
                <div className="flex items-center justify-between sticky top-0 bg-gray-50 py-2 px-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {groupName}
                    </h3>
                    <span className="ml-3 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                      {groupTasks.length} task
                      {groupTasks.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {groupTasks.filter((t) => !t.completed).length !==
                    groupTasks.length && (
                    <span className="text-xs text-gray-500">
                      {groupTasks.filter((t) => !t.completed).length} active
                    </span>
                  )}
                </div>
              )}

              {groupTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-xl p-4 shadow-sm border flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-3 rounded"
                      checked={task.completed}
                      onChange={() =>
                        handleTaskCompletionToggle(task.id, task.completed)
                      }
                    />
                    <div>
                      <p
                        className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}
                      >
                        {task.content || task.title}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                        {task.priority && (
                          <span
                            className={`px-2 py-1 rounded-full ${
                              task.priority === 4
                                ? "bg-red-100 text-red-600"
                                : task.priority === 3
                                  ? "bg-yellow-100 text-yellow-600"
                                  : task.priority === 2
                                    ? "bg-green-100 text-green-600"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            P{task.priority}
                          </span>
                        )}
                        {task.project_name && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                            {task.project_name
                              .toLowerCase()
                              .includes("bridge club")
                              ? "Bridge Club"
                              : task.project_name}
                          </span>
                        )}
                        {task.labels &&
                          task.labels.length > 0 &&
                          task.labels.map((label) => (
                            <span
                              key={label}
                              className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full"
                            >
                              @{label}
                            </span>
                          ))}
                        {task.due && (
                          <span
                            className={`px-2 py-1 rounded-full ${
                              isTaskOverdue(task)
                                ? "bg-red-100 text-red-600"
                                : isTaskDueToday(task)
                                  ? "bg-orange-100 text-orange-600"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {isTaskDueToday(task)
                              ? "Today"
                              : isTaskOverdue(task)
                                ? "Overdue"
                                : new Date(task.due).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {task.source === "todoist" && (
                      <>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 rounded-full hover:bg-gray-200 text-red-500"
                          title="Delete Task"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-trash-2"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" x2="10" y1="11" y2="17" />
                            <line x1="14" x2="14" y1="11" y2="17" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setShowEditTaskModal(true);
                          }}
                          className="p-1 rounded-full hover:bg-gray-200 text-blue-500"
                          title="Edit Task"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-edit"
                          >
                            <path d="M22 13.0476V22H2V2h10.0476" />
                            <path d="M17.477 3.35146 14.07 6.75841" />
                            <path d="M14.07 6.75841 12.042 4.73045" />
                            <path d="M12.042 4.73045 15.449 1.3235" />
                            <path d="M15.449 1.3235 17.477 3.35146" />
                            <path d="M17.477 3.35146 20.884 6.75841" />
                            <path d="M20.884 6.75841 18.856 8.78637" />
                            <path d="M18.856 8.78637 15.449 5.37941" />
                            <path d="M15.449 5.37941 17.477 3.35146Z" />
                          </svg>
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
              <label
                htmlFor="taskContent"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Task Content
              </label>
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
