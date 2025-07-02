import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  CheckSquare,
  Utensils,
  Dumbbell,
  MessageCircle,
  Plus,
  Users,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import DeepnotesEditor from "deepnotes-editor";
import "deepnotes-editor/dist/deepnotes-editor.css";
import TodoistService from "./services/TodoistService";
import GoogleCalendarService from "./services/GoogleCalendarService";

// Components
import Sidebar from "./components/common/Sidebar";
import EditTaskModal from "./components/tasks/EditTaskModal";
import EditEventModal from "./components/events/EditEventModal";
import Dashboard from "./components/Dashboard";

import TasksView from "./components/TasksView";
import ClaudeAssistant from "./components/ClaudeAssistant";
import Settings from "./components/Settings";

// Constants and utilities
import { mockWorkouts, mockRecipes, localTasks } from "./constants/mockData";
import {
  getWeekDates,
  formatWeekRange,
  isTaskOverdue,
  isTaskDueToday,
  isTaskDueThisWeek,
} from "./utils/dateUtils";
import {
  getFilteredTasks,
  getSortedTasks,
  getGroupedTasks,
  toggleFilter,
} from "./utils/taskUtils";

const DEBUG = process.env.NODE_ENV !== "production";

const LifeDashboardApp = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [todoistToken, setTodoistToken] = useState(
    localStorage.getItem("todoistToken") || "",
  );
  const [todoistTasks, setTodoistTasks] = useState([]);
  const [loadingTodoistTasks, setLoadingTodoistTasks] = useState(false);
  const [todoistError, setTodoistError] = useState(null);
  const [googleCalendarToken, setGoogleCalendarToken] = useState(
    localStorage.getItem("googleCalendarToken") || "",
  );
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState([]);
  const [loadingGoogleCalendarEvents, setLoadingGoogleCalendarEvents] =
    useState(false);
  const [googleCalendarError, setGoogleCalendarError] = useState(null);
  const [availableProjects, setAvailableProjects] = useState([]); // Initialize availableProjects here
  // Week start state - must be declared early since other functions depend on it
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(today.setDate(diff));
  });

  const tasks = React.useMemo(
    () => [...localTasks, ...todoistTasks],
    [todoistTasks],
  ); // Combine local and Todoist tasks

  // Memoized weekDates and unscheduledTasks for Weekly Planner
  const weekDates = React.useMemo(
    () => getWeekDates(currentWeekStart),
    [currentWeekStart],
  );
  const unscheduledTasks = React.useMemo(() => {
    // This function definition was previously in renderWeeklyPlanner, now it's a memoized value
    // It needs to be a function to be called from renderSidebar
    const getUnscheduledTasks = () =>
      tasks.filter(
        (task) =>
          task.source === "todoist" &&
          !task.completed &&
          !task.due && // Only truly unscheduled tasks (no due date)
          (!task.project_name ||
            task.project_name.toLowerCase() !== "shopping list"),
      );
    return getUnscheduledTasks();
  }, [tasks]);

  // Wrap fetchGoogleCalendarEvents in useCallback
  const fetchGoogleCalendarEvents = useCallback(
    async (token) => {
      setLoadingGoogleCalendarEvents(true);
      setGoogleCalendarError(null);
      try {
        const timeMin = new Date(currentWeekStart);
        const timeMax = new Date(currentWeekStart);
        timeMax.setDate(timeMax.getDate() + 7); // Fetch events for the entire week

        const fetchedEvents = await GoogleCalendarService.getEvents(
          token,
          timeMin,
          timeMax,
        );
        setGoogleCalendarEvents(fetchedEvents);
        localStorage.setItem("googleCalendarToken", token);
      } catch (error) {
        setGoogleCalendarError(error);
        console.error("Failed to fetch Google Calendar events:", error);
      } finally {
        setLoadingGoogleCalendarEvents(false);
      }
    },
    [
      currentWeekStart,
      setLoadingGoogleCalendarEvents,
      setGoogleCalendarError,
      setGoogleCalendarEvents,
    ],
  );

  const handleGoogleAuthClick = async () => {
    setLoadingGoogleCalendarEvents(true);
    setGoogleCalendarError(null);
    try {
      const accessToken = await GoogleCalendarService.handleAuthClick();
      setGoogleCalendarToken(accessToken);
      fetchGoogleCalendarEvents(accessToken);
    } catch (error) {
      setGoogleCalendarError(error);
      console.error("Google authentication failed:", error);
    } finally {
      setLoadingGoogleCalendarEvents(false);
    }
  };

  const handleUpdateCalendarEvent = async (eventId, eventData) => {
    if (!googleCalendarToken) {
      setGoogleCalendarError(new Error("Google Calendar not connected"));
      return;
    }

    try {
      const updatedEvent = await GoogleCalendarService.updateEvent(
        googleCalendarToken,
        eventId,
        eventData,
      );
      setGoogleCalendarEvents((prev) =>
        prev.map((event) => (event.id === eventId ? updatedEvent : event)),
      );
    } catch (error) {
      setGoogleCalendarError(error);
      console.error("Failed to update calendar event:", error);
    }
  };

  const handleDeleteCalendarEvent = async (eventId) => {
    if (!googleCalendarToken) {
      setGoogleCalendarError(new Error("Google Calendar not connected"));
      return;
    }

    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      await GoogleCalendarService.deleteEvent(googleCalendarToken, eventId);
      setGoogleCalendarEvents((prev) =>
        prev.filter((event) => event.id !== eventId),
      );
    } catch (error) {
      setGoogleCalendarError(error);
      console.error("Failed to delete calendar event:", error);
    }
  };

  const fetchTodoistTasks = useCallback(
    async (token) => {
      setLoadingTodoistTasks(true);
      setTodoistError(null);
      try {
        // Fetch both tasks and projects
        const [fetchedTasks, fetchedProjects] = await Promise.all([
          TodoistService.getTasks(token),
          TodoistService.getProjects(token),
        ]);

        // Create a project ID to name mapping
        const projectMap = {};
        fetchedProjects.forEach((project) => {
          projectMap[project.id] = project.name;
        });

        const formattedTasks = fetchedTasks.map((task) => {
          return {
            id: task.id,
            title: task.content, // Todoist uses 'content' for task description
            content: task.content, // Also keep content for consistency
            completed: task.is_completed || false, // REST API uses 'is_completed'
            priority: task.priority, // Todoist priority (1-4, 4 is highest)
            source: "todoist",
            due: task.due ? task.due.date || task.due.datetime : null, // Extract due date if available
            project_id: task.project_id || null,
            project_name: task.project_id ? projectMap[task.project_id] : null, // Only set if actually has a project
            labels: task.labels || [], // Task labels
          };
        });
        setTodoistTasks(formattedTasks);

        // Set available projects (only actual projects, no Inbox)
        const projects = fetchedProjects.map((project) => ({
          id: project.id,
          name: project.name,
        }));

        setAvailableProjects(projects);

        localStorage.setItem("todoistToken", token); // Save token only if fetch is successful
      } catch (error) {
        setTodoistError(error);
        console.error("Failed to fetch Todoist tasks:", error);
      } finally {
        setLoadingTodoistTasks(false);
      }
    },
    [
      setLoadingTodoistTasks,
      setTodoistError,
      setTodoistTasks,
      setAvailableProjects,
    ],
  );

  useEffect(() => {
    if (todoistToken) {
      fetchTodoistTasks(todoistToken);
    }
  }, [todoistToken, fetchTodoistTasks]);

  // Google Calendar Integration
  useEffect(() => {
    const initGoogleCalendar = async () => {
      try {
        await GoogleCalendarService.initClient();
        if (googleCalendarToken) {
          // Attempt to fetch events if a token already exists (e.g., from localStorage)
          // This might require a silent re-authentication or token refresh
          fetchGoogleCalendarEvents(googleCalendarToken);
        }
      } catch (error) {
        setGoogleCalendarError(
          new Error(
            `Failed to initialize Google Calendar client: ${error.message}`,
          ),
        );
        console.error("Google Calendar init error:", error);
      }
    };
    initGoogleCalendar();
  }, [googleCalendarToken, fetchGoogleCalendarEvents]);

  // Polling for Todoist tasks every 5 minutes
  useEffect(() => {
    let pollingInterval;
    if (todoistToken) {
      pollingInterval = setInterval(
        () => {
          fetchTodoistTasks(todoistToken);
        },
        5 * 60 * 1000,
      ); // 5 minutes
    }
    return () => clearInterval(pollingInterval);
  }, [todoistToken, fetchTodoistTasks]);

  // Polling for Google Calendar events every 5 minutes
  useEffect(() => {
    let pollingInterval;
    if (googleCalendarToken) {
      pollingInterval = setInterval(
        () => {
          fetchGoogleCalendarEvents(googleCalendarToken);
        },
        5 * 60 * 1000,
      ); // 5 minutes
    }
    return () => clearInterval(pollingInterval);
  }, [googleCalendarToken, currentWeekStart, fetchGoogleCalendarEvents]); // Re-fetch if week changes

  const handleSaveTodoistToken = () => {
    if (todoistToken) {
      fetchTodoistTasks(todoistToken);
    } else {
      setTodoistError(new Error("Please enter a Todoist API token."));
    }
  };

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState(1);
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskDueDateMode, setNewTaskDueDateMode] = useState("natural"); // 'natural' or 'picker'

  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // Stores the task being edited

  // Calendar event editing states
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // Stores the event being edited

  // Filter and sort states - support multiple active filters
  const [activeFilters, setActiveFilters] = useState(new Set(["all"])); // Set of active filter keys
  const [sortBy, setSortBy] = useState("default"); // 'default', 'date', 'priority', 'alphabetical'
  const [groupBy, setGroupBy] = useState("none"); // 'none', 'project', 'priority', 'date', 'label'
  const [selectedProjects, setSelectedProjects] = useState(new Set()); // Set of selected project IDs

  // Weekly planner state
  const [plannerMode, setPlannerMode] = useState("tasks"); // 'tasks', 'recipes', 'workouts', 'all'
  const [taskOrder, setTaskOrder] = useState({}); // Store task order by date
  const [scheduledRecipes, setScheduledRecipes] = useState({}); // Store scheduled recipes by date and meal type
  const [scheduledWorkouts, setScheduledWorkouts] = useState({}); // Store scheduled workouts by date
  const [taskFilter, setTaskFilter] = useState("all"); // 'all', 'bridge_club', 'home', 'urgent'

  // Day Planner state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scratchpadContent, setScratchpadContent] = useState("");
  const [dayTaskFilter, setDayTaskFilter] = useState("all"); // 'all', 'bridge_club', 'home', 'uncategorised'

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Week navigation utilities (now imported from dateUtils)

  const navigateWeek = (direction) => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + direction * 7);
    setCurrentWeekStart(newWeekStart);
  };

  const getTasksForDate = (date) => {
    const dateString = date.toISOString().split("T")[0];
    const dayTasks = tasks.filter(
      (task) => task.due && task.due.startsWith(dateString) && !task.completed,
    );

    // Apply custom ordering if it exists
    const order = taskOrder[dateString];
    if (order && order.length > 0) {
      const orderedTasks = [];
      const unorderedTasks = [];

      // First, add tasks in the specified order
      order.forEach((taskId) => {
        const task = dayTasks.find((t) => t.id === taskId);
        if (task) {
          orderedTasks.push(task);
        }
      });

      // Then add any tasks that aren't in the order (new tasks)
      dayTasks.forEach((task) => {
        if (!order.includes(task.id)) {
          unorderedTasks.push(task);
        }
      });

      return [...orderedTasks, ...unorderedTasks];
    }

    return dayTasks;
  };

  const handleTaskDrop = useCallback(
    async (taskId, targetDate, insertPosition = null) => {
      if (!todoistToken) {
        setTodoistError(new Error("Todoist API token is not set."));
        return;
      }

      // Update local state immediately (optimistic update)
      const newDueDate = targetDate
        ? targetDate.toISOString().split("T")[0]
        : null;
      setTodoistTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, due: newDueDate } : task,
        ),
      );

      // Handle reordering and cross-column positioning
      if (targetDate && insertPosition !== null) {
        const dateKey = targetDate.toISOString().split("T")[0];
        setTaskOrder((prevOrder) => {
          const newOrderState = { ...prevOrder };

          // Remove task from all existing orders (in case it's moving between columns)
          Object.keys(newOrderState).forEach((key) => {
            const order = newOrderState[key];
            const taskIndex = order.indexOf(taskId);
            if (taskIndex > -1) {
              newOrderState[key] = order.filter((id) => id !== taskId);
            }
          });

          // Get current order for target date
          const currentOrder = newOrderState[dateKey] || [];
          const newOrder = [...currentOrder];

          // Insert at the new position
          newOrder.splice(insertPosition, 0, taskId);

          newOrderState[dateKey] = newOrder;

          return newOrderState;
        });
      }

      try {
        let updateData;
        if (targetDate === null) {
          // Dropping to sidebar - remove due date
          updateData = { due_string: null };
        } else {
          // Dropping to a day - set due date
          const dateString = targetDate.toISOString().split("T")[0];
          updateData = { due_string: dateString };
        }

        await TodoistService.updateTask(todoistToken, taskId, updateData);
      } catch (error) {
        // Revert the optimistic update on error
        setTodoistTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId
              ? { ...task, due: task.due } // You might want to store the original value
              : task,
          ),
        );
        setTodoistError(error);
        console.error("Failed to update task date:", error);
      }
    },
    [todoistToken, setTodoistError, setTodoistTasks, setTaskOrder],
  );

  // Simplified drag handlers using HTML5 drag API

  // Use extracted utility functions for tasks view only

  const handleAddTask = async () => {
    if (!todoistToken) {
      setTodoistError(
        new Error("Todoist API token is not set. Please go to settings."),
      );
      return;
    }
    if (!newTaskContent.trim()) {
      setTodoistError(new Error("Task content cannot be empty."));
      return;
    }

    setLoadingTodoistTasks(true);
    setTodoistError(null);
    try {
      const createdTask = await TodoistService.addTask(todoistToken, {
        content: newTaskContent,
        priority: newTaskPriority,
        due_string: newTaskDueDate, // Todoist expects 'due_string' for natural language dates
      });

      // Format the created task and add it to local state immediately
      const formattedTask = {
        id: createdTask.id,
        title: createdTask.content,
        content: createdTask.content,
        completed: createdTask.is_completed || false,
        priority: createdTask.priority,
        source: "todoist",
        due: createdTask.due
          ? createdTask.due.date || createdTask.due.datetime
          : null,
      };

      setTodoistTasks((prevTasks) => [...prevTasks, formattedTask]);
      setNewTaskContent("");
      setNewTaskPriority(1);
      setNewTaskDueDate("");
      setShowAddTaskModal(false);
    } catch (error) {
      setTodoistError(error);
      console.error("Failed to add Todoist task:", error);
    } finally {
      setLoadingTodoistTasks(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!todoistToken) {
      setTodoistError(
        new Error("Todoist API token is not set. Please go to settings."),
      );
      return;
    }
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setLoadingTodoistTasks(true);
    setTodoistError(null);
    try {
      await TodoistService.deleteTask(todoistToken, taskId);
      setTodoistTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskId),
      );
    } catch (error) {
      setTodoistError(error);
      console.error("Failed to delete Todoist task:", error);
    } finally {
      setLoadingTodoistTasks(false);
    }
  };

  const handleEditTask = async (taskId, updates) => {
    if (!todoistToken) {
      setTodoistError(
        new Error("Todoist API token is not set. Please go to settings."),
      );
      return;
    }
    setLoadingTodoistTasks(true);
    setTodoistError(null);
    try {
      // Ensure due_string is correctly passed if a due date is present
      const formattedUpdates = { ...updates };
      if (formattedUpdates.due_string === "") {
        formattedUpdates.due_string = null; // Clear due date if empty string is passed
      }

      await TodoistService.updateTask(todoistToken, taskId, formattedUpdates);

      // Update local state immediately instead of refetching
      setTodoistTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                content: updates.content || task.content,
                title: updates.content || task.title,
                priority: updates.priority || task.priority,
                due: updates.due_string || task.due,
              }
            : task,
        ),
      );

      setEditingTask(null); // Clear editing task state
      setShowEditTaskModal(false); // Close the modal
    } catch (error) {
      setTodoistError(error);
      console.error("Failed to edit Todoist task:", error);
    } finally {
      setLoadingTodoistTasks(false);
    }
  };

  const handleTaskCompletionToggle = async (taskId, currentCompletedStatus) => {
    if (!todoistToken) {
      setTodoistError(
        new Error("Todoist API token is not set. Please go to settings."),
      );
      return;
    }

    setLoadingTodoistTasks(true);
    setTodoistError(null);
    try {
      if (currentCompletedStatus) {
        // Todoist API doesn't have a direct 'uncomplete' command via sync API for items.
        // For simplicity, we'll only allow completion for now.
        // A more robust solution might involve re-adding the task or using a different API.
        alert(
          "Uncompleting tasks is not yet supported for Todoist integration.",
        );
      } else {
        await TodoistService.completeTask(todoistToken, taskId);
        setTodoistTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, completed: true } : task,
          ),
        );
      }
    } catch (error) {
      setTodoistError(error);
      console.error("Failed to update Todoist task:", error);
    } finally {
      setLoadingTodoistTasks(false);
    }
  };

  const renderTasksView = () => {
    const filteredTasks = getFilteredTasks(
      tasks,
      activeFilters,
      selectedProjects,
    );
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

        {/* Filter, Sort, and Group Controls */}
        <div className="bg-white rounded-xl p-4 shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Sort Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group By
              </label>
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
              <span className="text-sm font-medium text-gray-700 mb-2 block">
                Quick Filters:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    key: "all",
                    label: "All",
                    count: tasks.filter(
                      (t) =>
                        !t.project_name ||
                        t.project_name.toLowerCase() !== "shopping list",
                    ).length,
                  },
                  {
                    key: "today",
                    label: "Today",
                    count: tasks.filter((t) => isTaskDueToday(t)).length,
                  },
                  {
                    key: "week",
                    label: "This Week",
                    count: tasks.filter((t) => isTaskDueThisWeek(t)).length,
                  },
                  {
                    key: "overdue",
                    label: "Overdue",
                    count: tasks.filter((t) => isTaskOverdue(t)).length,
                  },
                  {
                    key: "bridge_club",
                    label: "Bridge Club",
                    count: tasks.filter(
                      (t) =>
                        t.project_name &&
                        t.project_name.toLowerCase().includes("bridge club"),
                    ).length,
                  },
                  {
                    key: "home",
                    label: "Home",
                    count: tasks.filter(
                      (t) =>
                        t.project_name &&
                        t.project_name.toLowerCase() === "home",
                    ).length,
                  },
                  {
                    key: "cooking",
                    label: "Cooking",
                    count: tasks.filter(
                      (t) =>
                        t.project_name &&
                        t.project_name.toLowerCase() === "meal_planning",
                    ).length,
                  },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={(e) => toggleFilter(filter.key, e)}
                    className={`px-2 py-1 rounded-full text-xs transition-colors ${
                      activeFilters.has(filter.key)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                  <span className="text-sm font-medium text-gray-700">
                    Active Filters:
                  </span>
                  <button
                    onClick={() => {
                      setActiveFilters(new Set(["all"]));
                      setSelectedProjects(new Set());
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from(activeFilters)
                    .filter((f) => f !== "all")
                    .map((filter) => (
                      <span
                        key={filter}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {filter}
                      </span>
                    ))}
                  {Array.from(selectedProjects).map((projectId) => (
                    <span
                      key={projectId}
                      className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                    >
                      {availableProjects.find((p) => p.id === projectId)
                        ?.name || projectId}
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
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {groupName}
                    </h3>
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {groupTasks.length}
                    </span>
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
                      {/* Only show edit/delete for Todoist tasks */}
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

  // Enhanced Date Input Component
  const EnhancedDateInput = ({
    value,
    onChange,
    placeholder,
    mode,
    onModeChange,
  }) => {
    const handleDateChange = (e) => {
      onChange(e.target.value);
    };

    const handleModeToggle = () => {
      onModeChange(mode === "natural" ? "picker" : "natural");
    };

    const formatDateForInput = (dateValue) => {
      if (!dateValue) return "";
      if (mode === "picker") {
        // Try to convert to YYYY-MM-DD format for date input
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
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
            {mode === "natural" ? "Use Date Picker" : "Use Natural Language"}
          </button>
        </div>

        {mode === "natural" ? (
          <input
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={value}
            onChange={handleDateChange}
            placeholder={
              placeholder || "e.g., today, tomorrow, next monday, 2024-12-31"
            }
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
          {mode === "natural"
            ? "Try: today, tomorrow, next monday, in 2 weeks, 2024-12-31"
            : "Select a date from the calendar"}
        </div>
      </div>
    );
  };

  // Modal components now imported from separate files

  const renderDashboard = () => {
    // Helper functions for Day Planner
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

      if (selectedDate.toDateString() === today.toDateString()) {
        return "Today";
      } else if (selectedDate.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else if (selectedDate.toDateString() === tomorrow.toDateString()) {
        return "Tomorrow";
      } else {
        return selectedDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });
      }
    };

    // Get data for selected date
    const selectedDateKey = selectedDate.toISOString().split("T")[0];
    const dayTasks = getTasksForDate(selectedDate, taskOrder);
    const dayRecipes = scheduledRecipes[selectedDateKey] || {
      lunch: [],
      dinner: [],
    };
    const dayWorkouts = scheduledWorkouts[selectedDateKey] || [];

    // Filter tasks based on dayTaskFilter
    const getFilteredDayTasks = () => {
      let filtered = dayTasks;

      switch (dayTaskFilter) {
        case "bridge_club":
          filtered = dayTasks.filter(
            (task) =>
              task.project_name &&
              task.project_name.toLowerCase().includes("bridge club"),
          );
          break;
        case "home":
          filtered = dayTasks.filter(
            (task) =>
              task.project_name && task.project_name.toLowerCase() === "home",
          );
          break;
        case "uncategorised":
          filtered = dayTasks.filter(
            (task) => !task.project_name || task.project_name.trim() === "",
          );
          break;
        case "all":
        default:
          // No additional filtering needed
          break;
      }

      return filtered;
    };

    const filteredDayTasks = getFilteredDayTasks();

    return (
      <div className="p-6 space-y-6">
        {/* Day Navigation */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateDay(-1)}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {formatSelectedDate()}
              </h1>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Open date picker"
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => navigateDay(1)}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {showDatePicker && (
            <div className="mt-4 flex justify-center">
              <input
                type="date"
                value={selectedDate.toISOString().split("T")[0]}
                onChange={(e) => {
                  setSelectedDate(new Date(e.target.value));
                  setShowDatePicker(false);
                }}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Today's Workouts */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Dumbbell className="w-5 h-5 mr-2 text-green-600" />
                  Today's Workouts
                </h3>
                <span className="text-sm text-gray-500">
                  {dayWorkouts.length} scheduled
                </span>
              </div>

              <div className="space-y-3 min-h-[120px]">
                {dayWorkouts.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                    <div className="text-center">
                      <Dumbbell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No workouts scheduled</p>
                    </div>
                  </div>
                ) : (
                  dayWorkouts.map((workoutId) => {
                    const workout = mockWorkouts.find(
                      (w) => w.id === workoutId,
                    );
                    return workout ? (
                      <div
                        key={workout.id}
                        className="p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <h4 className="font-medium text-green-900">
                          {workout.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-green-700 mt-1">
                          <span>{workout.duration}</span>
                          <span>•</span>
                          <span>{workout.difficulty}</span>
                          <span>•</span>
                          <span>{workout.calories} cal</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          {workout.equipment}
                        </p>
                      </div>
                    ) : null;
                  })
                )}
              </div>
            </div>

            {/* Today's Meals */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Utensils className="w-5 h-5 mr-2 text-orange-600" />
                  Today's Meals
                </h3>
                <span className="text-sm text-gray-500">
                  {dayRecipes.lunch.length + dayRecipes.dinner.length} planned
                </span>
              </div>

              <div className="space-y-4">
                {/* Lunch */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    🍽️ Lunch
                  </h4>
                  <div className="space-y-2 min-h-[60px]">
                    {dayRecipes.lunch.length === 0 ? (
                      <div className="flex items-center justify-center h-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                        <p className="text-sm">No lunch planned</p>
                      </div>
                    ) : (
                      dayRecipes.lunch.map((recipeId) => {
                        const recipe = mockRecipes.find(
                          (r) => r.id === recipeId,
                        );
                        return recipe ? (
                          <div
                            key={recipe.id}
                            className="p-2 bg-orange-50 rounded-lg border border-orange-200"
                          >
                            <h5 className="font-medium text-orange-900 text-sm">
                              {recipe.name}
                            </h5>
                            <div className="flex items-center space-x-2 text-xs text-orange-700 mt-1">
                              <span>{recipe.cookTime}</span>
                              <span>•</span>
                              <span>{recipe.calories} cal</span>
                              <span>•</span>
                              <span>{recipe.servings} servings</span>
                            </div>
                          </div>
                        ) : null;
                      })
                    )}
                  </div>
                </div>

                {/* Dinner */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    🍽️ Dinner
                  </h4>
                  <div className="space-y-2 min-h-[60px]">
                    {dayRecipes.dinner.length === 0 ? (
                      <div className="flex items-center justify-center h-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                        <p className="text-sm">No dinner planned</p>
                      </div>
                    ) : (
                      dayRecipes.dinner.map((recipeId) => {
                        const recipe = mockRecipes.find(
                          (r) => r.id === recipeId,
                        );
                        return recipe ? (
                          <div
                            key={recipe.id}
                            className="p-2 bg-orange-50 rounded-lg border border-orange-200"
                          >
                            <h5 className="font-medium text-orange-900 text-sm">
                              {recipe.name}
                            </h5>
                            <div className="flex items-center space-x-2 text-xs text-orange-700 mt-1">
                              <span>{recipe.cookTime}</span>
                              <span>•</span>
                              <span>{recipe.calories} cal</span>
                              <span>•</span>
                              <span>{recipe.servings} servings</span>
                            </div>
                          </div>
                        ) : null;
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Tasks */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <CheckSquare className="w-5 h-5 mr-2 text-blue-600" />
                  Tasks
                </h3>
                <span className="text-sm text-gray-500">
                  {filteredDayTasks.length} tasks
                </span>
              </div>

              {/* Task Filter Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setDayTaskFilter("all")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    dayTaskFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All ({dayTasks.length})
                </button>
                <button
                  onClick={() => setDayTaskFilter("bridge_club")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    dayTaskFilter === "bridge_club"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Bridge Club (
                  {
                    dayTasks.filter(
                      (t) =>
                        t.project_name &&
                        t.project_name.toLowerCase().includes("bridge club"),
                    ).length
                  }
                  )
                </button>
                <button
                  onClick={() => setDayTaskFilter("home")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    dayTaskFilter === "home"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Home (
                  {
                    dayTasks.filter(
                      (t) =>
                        t.project_name &&
                        t.project_name.toLowerCase() === "home",
                    ).length
                  }
                  )
                </button>
                <button
                  onClick={() => setDayTaskFilter("uncategorised")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    dayTaskFilter === "uncategorised"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Uncategorised (
                  {
                    dayTasks.filter(
                      (t) => !t.project_name || t.project_name.trim() === "",
                    ).length
                  }
                  )
                </button>
              </div>

              <div className="space-y-3 min-h-[200px] max-h-[300px] overflow-y-auto">
                {filteredDayTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                    <div className="text-center">
                      <CheckSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No tasks for this filter</p>
                    </div>
                  </div>
                ) : (
                  filteredDayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            className="mr-3 mt-1 rounded"
                            checked={task.completed}
                            onChange={() =>
                              handleTaskCompletionToggle(
                                task.id,
                                task.completed,
                              )
                            }
                          />
                          <div>
                            <p
                              className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-blue-900"}`}
                            >
                              {task.content || task.title}
                            </p>
                            <div className="flex items-center space-x-2 text-xs mt-1">
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
                                  {task.project_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Scratchpad */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
                  Scratchpad
                </h3>
                <span className="text-sm text-gray-500">
                  Notes for {formatSelectedDate()}
                </span>
              </div>

              <div className="min-h-[200px] border rounded-lg p-4 bg-gray-50">
                <DeepnotesEditor
                  content={scratchpadContent}
                  onChange={setScratchpadContent}
                  placeholder="Start typing your notes, ideas, or reminders..."
                  className="min-h-[160px] w-full border-none bg-transparent focus:outline-none"
                  style={{
                    lineHeight: "normal",
                    display: "flex",
                    alignItems: "center",
                  }}
                  toolbar={false}
                  showToolbar={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWeeklyPlanner = () => {
    // weekDates and unscheduledTasks are now defined at the component level

    // Draggable components for different content types
    const DraggableTask = ({ task, isScheduled = false, index = 0 }) => (
      <Draggable draggableId={String(task.id)} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`p-2 rounded-md cursor-move group transition-colors ${
              isScheduled
                ? "bg-red-100 hover:bg-red-200"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs font-medium ${isScheduled ? "text-red-900" : "text-gray-900"}`}
                >
                  {task.content}
                </p>
                <div className="flex items-center text-xs mt-1 space-x-1">
                  {task.priority && (
                    <span
                      className={`px-1 py-0.5 rounded-full ${
                        isScheduled
                          ? "bg-red-200 text-red-700"
                          : task.priority === 4
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
                </div>
              </div>
              <GripVertical
                className={`w-3 h-3 opacity-0 group-hover:opacity-100 ${
                  isScheduled ? "text-red-600" : "text-gray-400"
                }`}
              />
            </div>
          </div>
        )}
      </Draggable>
    );

    const DraggableRecipe = ({ recipe, isScheduled = false, index = 0 }) => (
      <Draggable draggableId={String(recipe.id)} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`p-2 rounded-md cursor-move group transition-colors ${
              isScheduled
                ? "bg-orange-100 hover:bg-orange-200"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs font-medium ${isScheduled ? "text-orange-900" : "text-gray-900"}`}
                >
                  {recipe.name}
                </p>
                <div className="flex items-center text-xs mt-1 space-x-1">
                  <span
                    className={`px-1 py-0.5 rounded-full ${
                      isScheduled
                        ? "bg-orange-200 text-orange-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {recipe.cookTime}
                  </span>
                  <span
                    className={`px-1 py-0.5 rounded-full ${
                      isScheduled
                        ? "bg-orange-200 text-orange-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {recipe.calories} cal
                  </span>
                </div>
              </div>
              <GripVertical
                className={`w-3 h-3 opacity-0 group-hover:opacity-100 ${
                  isScheduled ? "text-orange-600" : "text-gray-400"
                }`}
              />
            </div>
          </div>
        )}
      </Draggable>
    );

    const DraggableWorkout = ({ workout, isScheduled = false, index = 0 }) => (
      <Draggable draggableId={String(workout.id)} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`p-2 rounded-md cursor-move group transition-colors ${
              isScheduled
                ? "bg-green-100 hover:bg-green-200"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs font-medium ${isScheduled ? "text-green-900" : "text-gray-900"}`}
                >
                  {workout.name}
                </p>
                <div className="flex items-center text-xs mt-1 space-x-1">
                  <span
                    className={`px-1 py-0.5 rounded-full ${
                      isScheduled
                        ? "bg-green-200 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {workout.duration}
                  </span>
                  <span
                    className={`px-1 py-0.5 rounded-full ${
                      isScheduled
                        ? "bg-green-200 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {workout.difficulty}
                  </span>
                </div>
              </div>
              <GripVertical
                className={`w-3 h-3 opacity-0 group-hover:opacity-100 ${
                  isScheduled ? "text-green-600" : "text-gray-400"
                }`}
              />
            </div>
          </div>
        )}
      </Draggable>
    );

    // Day column components for different modes
    const TaskModeDay = ({ date, dayName }) => {
      const dateKey = date.toISOString().split("T")[0];
      const dayTasks = getTasksForDate(date);
      const dayEvents = googleCalendarEvents.filter((event) => {
        const eventDate = new Date(event.start);
        return eventDate.toISOString().split("T")[0] === dateKey;
      });

      return (
        <Droppable droppableId={dateKey}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="bg-gray-50 rounded-lg p-3 min-h-[300px] border-2 border-dashed border-transparent hover:border-blue-300 transition-colors"
            >
              <div className="space-y-2">
                {dayTasks.map((task, index) => (
                  <DraggableTask
                    key={task.id}
                    task={task}
                    isScheduled={true}
                    index={index}
                  />
                ))}
                {dayEvents.map((event) => (
                  <Draggable
                    key={event.id}
                    draggableId={`event-${event.id}`}
                    index={dayTasks.length + dayEvents.indexOf(event)}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => {
                          setEditingEvent(event);
                          setShowEditEventModal(true);
                        }}
                        className="bg-blue-100 p-2 rounded-md cursor-pointer hover:bg-blue-200 transition-colors group"
                        title="Click to edit • Drag to reschedule"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-blue-900">
                              {event.title}
                            </p>
                            <p className="text-xs text-blue-600">
                              {new Date(event.start).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -
                              {new Date(event.end).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600" />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
              </div>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      );
    };

    const RecipeModeDay = ({ date, dayName }) => {
      const dateKey = date.toISOString().split("T")[0];
      const dayRecipes = scheduledRecipes[dateKey] || { lunch: [], dinner: [] };

      return (
        <div className="bg-gray-50 rounded-lg p-2 min-h-[300px] space-y-3">
          {/* Lunch Section */}
          <Droppable droppableId={`${dateKey}-lunch`}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-white rounded-md p-2 min-h-[120px] border-2 border-dashed border-orange-200 hover:border-orange-300 transition-colors"
              >
                <h4 className="text-xs font-semibold text-orange-800 mb-2">
                  🍽️ Lunch
                </h4>
                <div className="space-y-1">
                  {dayRecipes.lunch.map((recipeId, index) => {
                    const recipe = mockRecipes.find((r) => r.id === recipeId);
                    return recipe ? (
                      <DraggableRecipe
                        key={recipe.id}
                        recipe={recipe}
                        isScheduled={true}
                        index={index}
                      />
                    ) : null;
                  })}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Dinner Section */}
          <Droppable droppableId={`${dateKey}-dinner`}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-white rounded-md p-2 min-h-[120px] border-2 border-dashed border-orange-200 hover:border-orange-300 transition-colors"
              >
                <h4 className="text-xs font-semibold text-orange-800 mb-2">
                  🍽️ Dinner
                </h4>
                <div className="space-y-1">
                  {dayRecipes.dinner.map((recipeId, index) => {
                    const recipe = mockRecipes.find((r) => r.id === recipeId);
                    return recipe ? (
                      <DraggableRecipe
                        key={recipe.id}
                        recipe={recipe}
                        isScheduled={true}
                        index={index}
                      />
                    ) : null;
                  })}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      );
    };

    const WorkoutModeDay = ({ date, dayName }) => {
      const dateKey = date.toISOString().split("T")[0];
      const dayWorkouts = scheduledWorkouts[dateKey] || [];

      return (
        <Droppable droppableId={dateKey}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="bg-gray-50 rounded-lg p-3 min-h-[300px] border-2 border-dashed border-transparent hover:border-green-300 transition-colors"
            >
              <div className="space-y-2">
                {dayWorkouts.map((workoutId, index) => {
                  const workout = mockWorkouts.find((w) => w.id === workoutId);
                  return workout ? (
                    <DraggableWorkout
                      key={workout.id}
                      workout={workout}
                      isScheduled={true}
                      index={index}
                    />
                  ) : null;
                })}
              </div>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      );
    };

    const renderSidebar = () => {
      switch (plannerMode) {
        case "recipes":
          return (
            <Droppable droppableId="unscheduled-recipes">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="w-80 bg-white rounded-xl p-4 shadow-sm border"
                >
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Available Recipes ({mockRecipes.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {mockRecipes.map((recipe, index) => (
                      <DraggableRecipe
                        key={recipe.id}
                        recipe={recipe}
                        index={index}
                      />
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Drag recipes to schedule lunch or dinner
                    </p>
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          );

        case "workouts":
          return (
            <Droppable droppableId="unscheduled-workouts">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="w-80 bg-white rounded-xl p-4 shadow-sm border"
                >
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Available Workouts ({mockWorkouts.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {mockWorkouts.map((workout, index) => (
                      <DraggableWorkout
                        key={workout.id}
                        workout={workout}
                        index={index}
                      />
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Drag workouts to schedule them on specific days
                    </p>
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          );

        case "all":
          return (
            <Droppable droppableId="unscheduled-all">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="w-80 bg-white rounded-xl p-4 shadow-sm border"
                >
                  <h3 className="font-semibold text-gray-900 mb-4">
                    All Unscheduled Items
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {unscheduledTasks.map((task, index) => (
                      <DraggableTask key={task.id} task={task} index={index} />
                    ))}
                    {mockRecipes.map((recipe, index) => (
                      <DraggableRecipe
                        key={recipe.id}
                        recipe={recipe}
                        index={index}
                      />
                    ))}
                    {mockWorkouts.map((workout, index) => (
                      <DraggableWorkout
                        key={workout.id}
                        workout={workout}
                        index={index}
                      />
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Drag items to schedule them on specific days
                    </p>
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          );

        default: // tasks mode
          const startOfCurrentWeek = new Date(currentWeekStart); // currentWeekStart is already the start of the current week
          const overdueTasks = tasks.filter((task) => {
            if (!task.due) return false;
            const dueDate = new Date(task.due);
            // An overdue task from the previous week is one that was due before the start of the current week
            return dueDate < startOfCurrentWeek && !task.completed;
          });

          const getUnscheduledTasks = () =>
            tasks.filter(
              (task) =>
                task.source === "todoist" &&
                !task.completed &&
                !task.due && // Only truly unscheduled tasks (no due date)
                (!task.project_name ||
                  task.project_name.toLowerCase() !== "shopping list"),
            );

          return (
            <div className="w-80 bg-white rounded-xl p-4 shadow-sm border">
              {/* Overdue Tasks Box */}
              {overdueTasks.length > 0 && (
                <div
                  className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"
                  key="overdue-tasks-box"
                >
                  <h3 className="font-semibold text-red-800 mb-2">
                    Overdue Tasks ({overdueTasks.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {overdueTasks.map((task, index) => (
                      <div key={task.id} className="bg-red-100 p-2 rounded-md">
                        <p className="text-xs font-medium text-red-900">
                          {task.content}
                        </p>
                        <p className="text-xs text-red-600">
                          Due: {new Date(task.due).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Task Filters */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Task Filters
                </h3>
                <div
                  className="flex flex-wrap gap-2"
                  key="task-filters-buttons"
                >
                  <button
                    onClick={() => setTaskFilter("all")}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      taskFilter === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All ({tasks.filter((t) => !t.completed).length})
                  </button>
                  <button
                    onClick={() => setTaskFilter("bridge_club")}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      taskFilter === "bridge_club"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Bridge Club (
                    {
                      tasks.filter(
                        (t) =>
                          t.project_name &&
                          t.project_name
                            .toLowerCase()
                            .includes("bridge club") &&
                          !t.completed,
                      ).length
                    }
                    )
                  </button>
                  <button
                    onClick={() => setTaskFilter("home")}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      taskFilter === "home"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Home (
                    {
                      tasks.filter(
                        (t) =>
                          t.project_name &&
                          t.project_name.toLowerCase() === "home" &&
                          !t.completed,
                      ).length
                    }
                    )
                  </button>
                  <button
                    onClick={() => setTaskFilter("urgent")}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      taskFilter === "urgent"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Urgent (
                    {
                      tasks.filter((t) => t.priority === 4 && !t.completed)
                        .length
                    }
                    )
                  </button>
                </div>
              </div>

              <Droppable droppableId="unscheduled">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2 max-h-96 overflow-y-auto"
                  >
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Unscheduled Tasks ({unscheduledTasks.length})
                    </h3>
                    {unscheduledTasks.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        No unscheduled tasks
                      </p>
                    ) : (
                      unscheduledTasks.map((task, index) => (
                        <DraggableTask
                          key={task.id}
                          task={task}
                          index={index}
                        />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Drag tasks to schedule them on specific days
                </p>
              </div>
            </div>
          );
      }
    };

    const AllModeDay = ({ date, dayName }) => {
      const dateKey = date.toISOString().split("T")[0];
      const dayTasks = getTasksForDate(date);
      const dayRecipes = scheduledRecipes[dateKey] || { lunch: [], dinner: [] };
      const dayWorkouts = scheduledWorkouts[dateKey] || [];
      const dayEvents = googleCalendarEvents.filter((event) => {
        const eventDate = new Date(event.start);
        return eventDate.toISOString().split("T")[0] === dateKey;
      });

      return (
        <div className="bg-gray-50 rounded-lg p-2 min-h-[300px] space-y-3">
          {/* Events */}
          <div className="bg-blue-50 rounded-md p-2 min-h-[80px] border-2 border-dashed border-blue-200">
            <h4 className="text-xs font-semibold text-blue-800 mb-2">
              🗓️ Events
            </h4>
            <div className="space-y-1">
              {dayEvents.map((event) => (
                <div key={event.id} className="bg-blue-100 p-2 rounded-md">
                  <p className="text-xs font-medium text-blue-900">
                    {event.title}
                  </p>
                  <p className="text-xs text-blue-600">
                    {new Date(event.start).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -
                    {new Date(event.end).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <Droppable droppableId={`${dateKey}-tasks`}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-white rounded-md p-2 min-h-[80px] border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors"
              >
                <h4 className="text-xs font-semibold text-blue-800 mb-2">
                  ✅ Tasks
                </h4>
                <div className="space-y-1">
                  {dayTasks.map((task, index) => (
                    <DraggableTask
                      key={task.id}
                      task={task}
                      isScheduled={true}
                      index={index}
                    />
                  ))}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Lunch */}
          <Droppable droppableId={`${dateKey}-lunch`}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-white rounded-md p-2 min-h-[80px] border-2 border-dashed border-orange-200 hover:border-orange-300 transition-colors"
              >
                <h4 className="text-xs font-semibold text-orange-800 mb-2">
                  🍽️ Lunch
                </h4>
                <div className="space-y-1">
                  {dayRecipes.lunch.map((recipeId, index) => {
                    const recipe = mockRecipes.find((r) => r.id === recipeId);
                    return recipe ? (
                      <DraggableRecipe
                        key={recipe.id}
                        recipe={recipe}
                        isScheduled={true}
                        index={index}
                      />
                    ) : null;
                  })}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Dinner */}
          <Droppable droppableId={`${dateKey}-dinner`}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-white rounded-md p-2 min-h-[80px] border-2 border-dashed border-orange-200 hover:border-orange-300 transition-colors"
              >
                <h4 className="text-xs font-semibold text-orange-800 mb-2">
                  🍽️ Dinner
                </h4>
                <div className="space-y-1">
                  {dayRecipes.dinner.map((recipeId, index) => {
                    const recipe = mockRecipes.find((r) => r.id === recipeId);
                    return recipe ? (
                      <DraggableRecipe
                        key={recipe.id}
                        recipe={recipe}
                        isScheduled={true}
                        index={index}
                      />
                    ) : null;
                  })}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Workouts */}
          <Droppable droppableId={`${dateKey}-workouts`}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-white rounded-md p-2 min-h-[80px] border-2 border-dashed border-green-200 hover:border-green-300 transition-colors"
              >
                <h4 className="text-xs font-semibold text-green-800 mb-2">
                  💪 Workouts
                </h4>
                <div className="space-y-1">
                  {dayWorkouts.map((workoutId, index) => {
                    const workout = mockWorkouts.find(
                      (w) => w.id === workoutId,
                    );
                    return workout ? (
                      <DraggableWorkout
                        key={workout.id}
                        workout={workout}
                        isScheduled={true}
                        index={index}
                      />
                    ) : null;
                  })}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      );
    };

    const renderDayColumns = () => {
      switch (plannerMode) {
        case "recipes":
          return weekDates.map((date) => {
            const dateKey = date.toISOString().split("T")[0];
            return (
              <RecipeModeDay
                key={dateKey}
                date={date}
                dayName={date.toLocaleDateString("en-US", { weekday: "short" })}
              />
            );
          });
        case "workouts":
          return weekDates.map((date) => {
            const dateKey = date.toISOString().split("T")[0];
            return (
              <WorkoutModeDay
                key={dateKey}
                date={date}
                dayName={date.toLocaleDateString("en-US", { weekday: "short" })}
              />
            );
          });
        case "all":
          return weekDates.map((date) => {
            const dateKey = date.toISOString().split("T")[0];
            return (
              <AllModeDay
                key={dateKey}
                date={date}
                dayName={date.toLocaleDateString("en-US", { weekday: "short" })}
              />
            );
          });
        default:
          return weekDates.map((date) => {
            const dateKey = date.toISOString().split("T")[0];
            return (
              <TaskModeDay
                key={dateKey}
                date={date}
                dayName={date.toLocaleDateString("en-US", { weekday: "short" })}
              />
            );
          });
      }
    };

    return (
      <div className="p-6">
        {/* Week Navigation and Mode Toggle Header */}
        <div className="bg-white rounded-xl p-4 shadow-sm border mb-6 space-y-4">
          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateWeek(-1)}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous Week
            </button>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {formatWeekRange(currentWeekStart)}
              </h2>
              <p className="text-sm text-gray-500">
                {new Date().getFullYear()}
              </p>
            </div>

            <button
              onClick={() => navigateWeek(1)}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Next Week
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center justify-center">
            <div className="bg-gray-100 p-1 rounded-lg flex space-x-1">
              <button
                onClick={() => setPlannerMode("tasks")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  plannerMode === "tasks"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <CheckSquare className="w-4 h-4 inline mr-2" />
                Tasks
              </button>
              <button
                onClick={() => setPlannerMode("recipes")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  plannerMode === "recipes"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Utensils className="w-4 h-4 inline mr-2" />
                Recipes
              </button>
              <button
                onClick={() => setPlannerMode("workouts")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  plannerMode === "workouts"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Dumbbell className="w-4 h-4 inline mr-2" />
                Workouts
              </button>
              <button
                onClick={() => setPlannerMode("all")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  plannerMode === "all"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          {renderSidebar()}

          {/* Week Calendar */}
          <div className="flex-1">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-4 mb-4">
              {weekDates.map((date, index) => (
                <div key={index} className="text-center">
                  <h3 className="font-semibold text-gray-900">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            <div className="grid grid-cols-7 gap-4">{renderDayColumns()}</div>
          </div>
        </div>

        {/* Mode-specific Legend */}
        <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
          {plannerMode === "tasks" && (
            <>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-100 rounded mr-2"></div>
                <span>Todoist Tasks</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
                <span>Events</span>
              </div>
            </>
          )}
          {plannerMode === "recipes" && (
            <>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-100 rounded mr-2"></div>
                <span>Recipes</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-200 rounded mr-2"></div>
                <span>Lunch</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-300 rounded mr-2"></div>
                <span>Dinner</span>
              </div>
            </>
          )}
          {plannerMode === "workouts" && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
              <span>Workouts</span>
            </div>
          )}
          {plannerMode === "all" && (
            <>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-100 rounded mr-2"></div>
                <span>Todoist Tasks</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
                <span>Events</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-100 rounded mr-2"></div>
                <span>Recipes</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
                <span>Workouts</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderClaudeAssistant = () => (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Claude Assistant</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Online</span>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border p-4 mb-6 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900">
                Hello! I'm your Claude assistant. I can help you with:
              </p>
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Planning your weekly schedule and optimizing your time</li>
                <li>Suggesting recipes based on your dietary preferences</li>
                <li>Creating workout plans and tracking fitness goals</li>
                <li>Managing tasks and setting reminders</li>
                <li>Analyzing your habits and providing insights</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-3">
              <p className="text-gray-900">
                Can you suggest a healthy meal plan for this week that takes
                less than 30 minutes to prepare?
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900">
                I'd be happy to help! Based on your recipe app data, here are
                some quick, healthy options:
              </p>
              <div className="mt-2 space-y-2">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium text-blue-900">
                    Monday: Chicken Teriyaki Bowl
                  </p>
                  <p className="text-sm text-blue-600">
                    25 min • 420 cal • High protein
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium text-blue-900">
                    Tuesday: Salmon & Quinoa
                  </p>
                  <p className="text-sm text-blue-600">
                    30 min • 380 cal • Omega-3 rich
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Would you like me to add these to your weekly planner?
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="text"
          placeholder="Ask Claude anything about your schedule, workouts, or nutrition..."
          className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Send
        </button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Todoist Integration
        </h3>
        <p className="text-gray-600 mb-4">
          Enter your Todoist API token to sync your tasks.
        </p>
        <div className="flex items-end space-x-3">
          <input
            type="text"
            placeholder="Your Todoist API Token"className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={todoistToken}
            onChange={(e) => setTodoistToken(e.target.value)}
          />
          <button
            onClick={handleSaveTodoistToken}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Token
          </button>
        </div>
        {todoistError && (
          <p className="text-red-500 mt-2">Error: {todoistError.message}</p>
        )}
        {todoistToken && !todoistError && (
          <p className="text-green-600 mt-2">
            Todoist token saved and tasks fetched successfully!
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-semibold text-gray-900 mb-4">
          Google Calendar Integration
        </h3>
        <p className="text-gray-600 mb-4">
          Connect your Google Calendar to display events in the planner.
        </p>
        <div className="flex items-end space-x-3">
          <button
            onClick={handleGoogleAuthClick}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={loadingGoogleCalendarEvents}
          >
            {loadingGoogleCalendarEvents
              ? "Connecting..."
              : "Connect Google Calendar"}
          </button>
        </div>
        {googleCalendarError && (
          <p className="text-red-500 mt-2">
            Error: {googleCalendarError.message}
          </p>
        )}
        {googleCalendarToken && !googleCalendarError && (
          <p className="text-green-600 mt-2">
            Google Calendar connected and events fetched successfully!
          </p>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <Dashboard
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            tasks={tasks}
            getTasksForDate={getTasksForDate}
            scratchpadContent={scratchpadContent}
            setScratchpadContent={setScratchpadContent}
            handleTaskCompletionToggle={handleTaskCompletionToggle}
            scheduledRecipes={scheduledRecipes}
            scheduledWorkouts={scheduledWorkouts}
            dayTaskFilter={dayTaskFilter}
            setDayTaskFilter={setDayTaskFilter}
          />
        );
      case "planner":
        return renderWeeklyPlanner();
      case "tasks":
        return (
          <TasksView
            tasks={tasks}
            todoistToken={todoistToken}
            loadingTodoistTasks={loadingTodoistTasks}
            todoistError={todoistError}
            fetchTodoistTasks={fetchTodoistTasks}
            setShowAddTaskModal={setShowAddTaskModal}
            showAddTaskModal={showAddTaskModal}
            newTaskContent={newTaskContent}
            setNewTaskContent={setNewTaskContent}
            newTaskPriority={newTaskPriority}
            setNewTaskPriority={setNewTaskPriority}
            newTaskDueDate={newTaskDueDate}
            setNewTaskDueDate={setNewTaskDueDate}
            newTaskDueDateMode={newTaskDueDateMode}
            setNewTaskDueDateMode={setNewTaskDueDateMode}
            handleAddTask={handleAddTask}
            handleDeleteTask={handleDeleteTask}
            handleTaskCompletionToggle={handleTaskCompletionToggle}
            setEditingTask={setEditingTask}
            setShowEditTaskModal={setShowEditTaskModal}
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
            sortBy={sortBy}
            setSortBy={setSortBy}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
            selectedProjects={selectedProjects}
            setSelectedProjects={setSelectedProjects}
            availableProjects={availableProjects}
          />
        );
      case "claude":
        return <ClaudeAssistant />;
      case "settings":
        return (
          <Settings
            todoistToken={todoistToken}
            setTodoistToken={setTodoistToken}
            handleSaveTodoistToken={handleSaveTodoistToken}
            todoistError={todoistError}
            googleCalendarToken={googleCalendarToken}
            handleGoogleAuthClick={handleGoogleAuthClick}
            googleCalendarError={googleCalendarError}
            loadingGoogleCalendarEvents={loadingGoogleCalendarEvents}
          />
        );
      default:
        return (
          <div className="p-6 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Coming Soon
              </h3>
              <p className="text-gray-600">
                This feature is under development.
              </p>
            </div>
          </div>
        );
    }
  };

  const onDragEnd = React.useCallback(
    (result) => {
      const { destination, draggableId, source } = result;

      if (!destination) {
        return;
      }

      // If dropped in the same position, do nothing
      if (destination.droppableId === source.droppableId && destination.index === source.index) {
        return;
      }

      // Handle different modes
      if (plannerMode === "recipes") {
        if (destination.droppableId === "unscheduled-recipes") {
          // Dragged back to sidebar - remove from schedule
          if (DEBUG) console.log("Removing recipe from schedule:", draggableId);
          setScheduledRecipes((prev) => {
            const newScheduled = { ...prev };
            Object.keys(newScheduled).forEach((dateKey) => {
              if (
                newScheduled[dateKey] &&
                typeof newScheduled[dateKey] === "object"
              ) {
                Object.keys(newScheduled[dateKey]).forEach((mealType) => {
                  if (Array.isArray(newScheduled[dateKey][mealType])) {
                    newScheduled[dateKey][mealType] = newScheduled[dateKey][
                      mealType
                    ].filter((id) => id !== draggableId);
                  }
                });
              }
            });
            if (DEBUG)
              console.log("After removal, scheduled recipes:", newScheduled);
            return newScheduled;
          });
          return;
        }

        // Handle recipe scheduling - expect format like "2025-01-01-lunch"
        const parts = destination.droppableId.split("-");
        if (parts.length >= 4) {
          const dateKey = `${parts[0]}-${parts[1]}-${parts[2]}`;
          const mealType = parts[3];

          if (DEBUG)
            console.log(
              "Scheduling recipe:",
              draggableId,
              "to",
              dateKey,
              mealType,
            );

          setScheduledRecipes((prev) => {
            const newScheduled = { ...prev };

            // Remove from any existing dates/meals first
            Object.keys(newScheduled).forEach((existingDateKey) => {
              if (
                newScheduled[existingDateKey] &&
                typeof newScheduled[existingDateKey] === "object"
              ) {
                Object.keys(newScheduled[existingDateKey]).forEach(
                  (existingMealType) => {
                    if (Array.isArray(newScheduled[existingDateKey][existingMealType])) {
                      newScheduled[existingDateKey][existingMealType] =
                        newScheduled[existingDateKey][existingMealType].filter(
                          (id) => id !== draggableId,
                        );
                    }
                  },
                );
              }
            });

            // Add to new date/meal at the specific index
            if (!newScheduled[dateKey]) {
              newScheduled[dateKey] = { lunch: [], dinner: [] };
            }
            if (!newScheduled[dateKey][mealType]) {
              newScheduled[dateKey][mealType] = [];
            }

            // Insert at the specific index instead of just pushing
            const targetArray = [...newScheduled[dateKey][mealType]];
            targetArray.splice(destination.index, 0, draggableId);
            newScheduled[dateKey][mealType] = targetArray;

            if (DEBUG)
              console.log("Updated scheduled recipes:", newScheduled);
            return newScheduled;
          });
          return;
        } else {
          console.error(
            "Invalid droppable ID format for recipes:",
            destination.droppableId,
          );
          return;
        }
      }

      if (plannerMode === "workouts") {
        if (destination.droppableId === "unscheduled-workouts") {
          // Dragged back to sidebar - remove from schedule
          setScheduledWorkouts((prev) => {
            const newScheduled = { ...prev };
            Object.keys(newScheduled).forEach((dateKey) => {
              newScheduled[dateKey] = newScheduled[dateKey].filter(
                (id) => id !== draggableId,
              );
            });
            return newScheduled;
          });
          return;
        }

        // Handle workout scheduling - droppableId should be the date key
        let dateKey = destination.droppableId;

        // Handle the case where the droppableId includes "-workouts" suffix
        if (dateKey.endsWith("-workouts")) {
          const parts = dateKey.split("-");
          if (parts.length >= 4) {
            dateKey = `${parts[0]}-${parts[1]}-${parts[2]}`;
          }
        }

        setScheduledWorkouts((prev) => {
          const newScheduled = { ...prev };

          // Remove from any existing dates first
          Object.keys(newScheduled).forEach((existingDateKey) => {
            newScheduled[existingDateKey] = newScheduled[
              existingDateKey
            ].filter((id) => id !== draggableId);
          });

          // Add to new date at the specific index
          if (!newScheduled[dateKey]) {
            newScheduled[dateKey] = [];
          }

          const targetArray = [...newScheduled[dateKey]];
          targetArray.splice(destination.index, 0, draggableId);
          newScheduled[dateKey] = targetArray;

          return newScheduled;
        });
        return;
      }

      if (plannerMode === "all") {
        // Handle different droppable types in "all" mode
        if (destination.droppableId === "unscheduled-all") {
          // Dragged back to sidebar - remove from all schedules
          const isRecipe = mockRecipes.some((r) => r.id === draggableId);
          const isWorkout = mockWorkouts.some((w) => w.id === draggableId);

          if (isRecipe) {
            setScheduledRecipes((prev) => {
              const newScheduled = { ...prev };
              Object.keys(newScheduled).forEach((dateKey) => {
                if (
                  newScheduled[dateKey] &&
                  typeof newScheduled[dateKey] === "object"
                ) {
                  Object.keys(newScheduled[dateKey]).forEach((mealType) => {
                    if (Array.isArray(newScheduled[dateKey][mealType])) {
                      newScheduled[dateKey][mealType] = newScheduled[dateKey][
                        mealType
                      ].filter((id) => id !== draggableId);
                    }
                  });
                }
              });
              return newScheduled;
            });
          } else if (isWorkout) {
            setScheduledWorkouts((prev) => {
              const newScheduled = { ...prev };
              Object.keys(newScheduled).forEach((dateKey) => {
                newScheduled[dateKey] = newScheduled[dateKey].filter(
                  (id) => id !== draggableId,
                );
              });
              return newScheduled;
            });
          } else {
            // It's a task
            handleTaskDrop(draggableId, null, destination.index);
          }
          return;
        }

        // Handle drops to specific day containers with meal types or workouts
        const parts = destination.droppableId.split("-");
        if (parts.length >= 4 && (parts[3] === "lunch" || parts[3] === "dinner")) {
          // Recipe drop with meal type (e.g., "2025-01-01-lunch")
          const dateKey = `${parts[0]}-${parts[1]}-${parts[2]}`;
          const mealType = parts[3];

          setScheduledRecipes((prev) => {
            const newScheduled = { ...prev };
            // Remove from existing locations
            Object.keys(newScheduled).forEach((existingDateKey) => {
              if (
                newScheduled[existingDateKey] &&
                typeof newScheduled[existingDateKey] === "object"
              ) {
                Object.keys(newScheduled[existingDateKey]).forEach(
                  (existingMealType) => {
                    if (Array.isArray(newScheduled[existingDateKey][existingMealType])) {
                      newScheduled[existingDateKey][existingMealType] =
                        newScheduled[existingDateKey][existingMealType].filter(
                          (id) => id !== draggableId,
                        );
                    }
                  },
                );
              }
            });
            // Add to new location at specific index
            if (!newScheduled[dateKey]) {
              newScheduled[dateKey] = { lunch: [], dinner: [] };
            }
            if (!newScheduled[dateKey][mealType]) {
              newScheduled[dateKey][mealType] = [];
            }

            const targetArray = [...newScheduled[dateKey][mealType]];
            targetArray.splice(destination.index, 0, draggableId);
            newScheduled[dateKey][mealType] = targetArray;
            return newScheduled;
          });
        } else if (parts.length >= 4 && parts[3] === "workouts") {
          // Workout drop (e.g., "2025-01-01-workouts")
          const dateKey = `${parts[0]}-${parts[1]}-${parts[2]}`;

          setScheduledWorkouts((prev) => {
            const newScheduled = { ...prev };
            // Remove from existing locations
            Object.keys(newScheduled).forEach((existingDateKey) => {
              newScheduled[existingDateKey] = newScheduled[
                existingDateKey
              ].filter((id) => id !== draggableId);
            });
            // Add to new location at specific index
            if (!newScheduled[dateKey]) {
              newScheduled[dateKey] = [];
            }

            const targetArray = [...newScheduled[dateKey]];
            targetArray.splice(destination.index, 0, draggableId);
            newScheduled[dateKey] = targetArray;
            return newScheduled;
          });
        } else {
          try {
            // Task drop to a date
            const destDate = new Date(destination.droppableId);
            if (isNaN(destDate.getTime())) {
              console.error(
                "Invalid date for task scheduling:",
                destination.droppableId,
              );
              return;
            }
            handleTaskDrop(draggableId, destDate, destination.index);
          } catch (error) {
            console.error("Error handling task drop:", error);
          }
          return;
        }
      }

      // Default task mode handling (if not in 'all' mode)
      if (destination.droppableId === "unscheduled") {
        handleTaskDrop(draggableId, null, destination.index);
        return;
      }

      try {
        const destDate = new Date(destination.droppableId);
        if (isNaN(destDate.getTime())) {
          console.error(
            "Invalid date for task scheduling:",
            destination.droppableId,
          );
          return;
        }
        handleTaskDrop(draggableId, destDate, destination.index);
      } catch (error) {
        console.error("Error handling task drop:", error);
      }
    },
    [plannerMode, setScheduledRecipes, setScheduledWorkouts, handleTaskDrop, mockRecipes, mockWorkouts]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-screen bg-gray-100">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
        />
        <div className="flex-1 overflow-auto">{renderContent()}</div>
        {showEditTaskModal && editingTask && (
          <EditTaskModal
            task={editingTask}
            onClose={() => setShowEditTaskModal(false)}
            onSave={handleEditTask}
          />
        )}
        {showEditEventModal && editingEvent && (
          <EditEventModal
            event={editingEvent}
            onClose={() => setShowEditEventModal(false)}
            onSave={handleUpdateCalendarEvent}
            onDelete={handleDeleteCalendarEvent}
          />
        )}
      </div>
    </DragDropContext>
  );
};

export default LifeDashboardApp;