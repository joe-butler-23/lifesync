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

      {/* Modern Filter Toolbar */}
      <div className="bg-white rounded-xl border shadow-sm mb-6 overflow-hidden">
        {/* Main Toolbar */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Search and Quick Filters */}
            <div className="flex-1 flex items-center gap-3">
              {/* Search Box */}
              <div className="relative min-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              {/* Quick Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto">
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
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? "bg-blue-100 text-blue-700 border border-blue-200 shadow-sm"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {filter.label}
                      <span
                        className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                          isActive
                            ? "bg-blue-200 text-blue-800"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {filter.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Sort, Group, Advanced Filters */}
            <div className="flex items-center gap-2">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="default">Default Order</option>
                  <option value="date">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
                <SortAsc className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Group Dropdown */}
              <div className="relative">
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="none">No Grouping</option>
                  <option value="date">By Due Date</option>
                  <option value="priority">By Priority</option>
                  <option value="project">By Project</option>
                  <option value="label">By Label</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showAdvancedFilters ||
                  priorityFilter.length > 0 ||
                  selectedLabels.size > 0
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {(priorityFilter.length > 0 || selectedLabels.size > 0) && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                    {priorityFilter.length + selectedLabels.size}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Priority Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Priority
                </label>
                <div className="flex flex-wrap gap-1">
                  {[4, 3, 2, 1].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => {
                        const newPriorities = priorityFilter.includes(priority)
                          ? priorityFilter.filter((p) => p !== priority)
                          : [...priorityFilter, priority];
                        setPriorityFilter(newPriorities);
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        priorityFilter.includes(priority)
                          ? priority === 4
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : priority === 3
                              ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                              : priority === 2
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                          : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      P{priority}
                    </button>
                  ))}
                </div>
              </div>

              {/* Label Filter */}
              {availableLabels.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Labels
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {availableLabels.slice(0, 6).map((label) => (
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
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          selectedLabels.has(label)
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        @{label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Advanced Filters */}
              {(priorityFilter.length > 0 || selectedLabels.size > 0) && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setPriorityFilter([]);
                      setSelectedLabels(new Set());
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Clear advanced filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {(Array.from(activeFilters).filter((f) => f !== "all").length > 0 ||
          selectedProjects.size > 0 ||
          priorityFilter.length > 0 ||
          selectedLabels.size > 0 ||
          searchQuery.trim()) && (
          <div className="p-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                Active Filters ({filteredTasks.length} results)
              </span>
              <button
                onClick={() => {
                  setActiveFilters(new Set(["all"]));
                  setSelectedProjects(new Set());
                  setPriorityFilter([]);
                  setSelectedLabels(new Set());
                  setSearchQuery("");
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 text-blue-800 rounded text-xs">
                  <Search className="w-3 h-3" />"{searchQuery}"
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {Array.from(activeFilters)
                .filter((f) => f !== "all")
                .map((filter) => (
                  <span
                    key={filter}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 text-blue-800 rounded text-xs"
                  >
                    {filter}
                    <button
                      onClick={() => handleRemoveFilter("quick", filter)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              {Array.from(selectedProjects).map((projectId) => (
                <span
                  key={projectId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-green-200 text-green-800 rounded text-xs"
                >
                  <Folder className="w-3 h-3" />
                  {availableProjects.find((p) => p.id === projectId)?.name ||
                    projectId}
                  <button
                    onClick={() => handleRemoveFilter("project", projectId)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {priorityFilter.map((priority) => (
                <span
                  key={priority}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-orange-200 text-orange-800 rounded text-xs"
                >
                  <Flag className="w-3 h-3" />P{priority}
                  <button
                    onClick={() => handleRemoveFilter("priority", priority)}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {Array.from(selectedLabels).map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-purple-200 text-purple-800 rounded text-xs"
                >
                  <Tag className="w-3 h-3" />@{label}
                  <button
                    onClick={() => handleRemoveFilter("label", label)}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
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
