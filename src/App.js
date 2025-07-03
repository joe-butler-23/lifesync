
// The code modification enhances Todoist integration by adding token validation and improved error logging.

import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Calendar,
  CheckSquare,
  GripVertical,
  Utensils,
  Dumbbell,
} from "lucide-react";

// Import services
import TodoistService from "./services/TodoistService";
import GoogleCalendarService from "./services/GoogleCalendarService";

// Import components
import Sidebar from "./components/common/Sidebar";
import Dashboard from "./components/Dashboard";
import TasksView from "./components/TasksView";
import Settings from "./components/Settings";
import ClaudeAssistant from "./components/ClaudeAssistant";
import EditTaskModal from "./components/tasks/EditTaskModal";
import EditEventModal from "./components/events/EditEventModal";

// Import utilities and constants
import { toDateKey, parseDateKey, formatWeekRange, getWeekDates } from "./utils/dateUtils";
import { filterUnscheduledTasks } from "./utils/taskUtils";
import { mockRecipes, mockWorkouts } from "./constants/mockData";

// Debug flag
const DEBUG = false;

function App() {
  // View state
  const [activeView, setActiveView] = useState("dashboard");

  // Integration tokens/states
  const [todoistToken, setTodoistToken] = useState(() => {
    return localStorage.getItem("todoistToken") || "";
  });
  const [googleCalendarToken, setGoogleCalendarToken] = useState(() => {
    return localStorage.getItem("googleCalendarToken") || "";
  });
  const [claudeApiKey, setClaudeApiKey] = useState(() => {
    return localStorage.getItem("claude_api_key") || "";
  });

  // Data states
  const [todoistTasks, setTodoistTasks] = useState([]);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);

  // Loading and error states
  const [loadingTodoistTasks, setLoadingTodoistTasks] = useState(false);
  const [loadingGoogleCalendarEvents, setLoadingGoogleCalendarEvents] = useState(false);
  const [todoistError, setTodoistError] = useState(null);
  const [googleCalendarError, setGoogleCalendarError] = useState(null);
  const [claudeApiError, setClaudeApiError] = useState(null);

  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  });

  // Derived state
  const tasks = todoistTasks;
  const weekDates = getWeekDates(currentWeekStart);
  const unscheduledTasks = tasks.filter((task) => !task.due && !task.completed);

  // Todoist Integration
  const fetchTodoistTasks = useCallback(
    async (token) => {
      if (!token) return;

      setLoadingTodoistTasks(true);
      setTodoistError(null);
      try {
        const [fetchedTasks, fetchedProjects] = await Promise.all([
          TodoistService.getTasks(token),
          TodoistService.getProjects(token),
        ]);

        const projectMap = {};
        fetchedProjects.forEach((project) => {
          projectMap[project.id] = project.name;
        });

        const formattedTasks = fetchedTasks.map((task) => {
          return {
            id: task.id,
            title: task.content, // Todoist uses 'content' for task title
            content: task.content, // Also keep content for consistency
            description: task.description || "", // Task description
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

  const handleSaveClaudeApiKey = () => {
    if (claudeApiKey.trim()) {
      localStorage.setItem("claude_api_key", claudeApiKey);
      setClaudeApiError(null);
      // You can add validation here if needed
    } else {
      setClaudeApiError(new Error("Please enter a valid Anthropic API key."));
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
  const [scratchpadContent, setScratchpadContent] = useState(() => {
    const dateKey = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const stored = localStorage.getItem(`scratchpad-${dateKey}`);
    return stored || JSON.stringify({
      id: 'root',
      content: '',
      children: []
    });
  });
  const [dayTaskFilter, setDayTaskFilter] = useState("all"); // 'all', 'bridge_club', 'home', 'uncategorised'

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load scratchpad content when selected date changes
  useEffect(() => {
    const dateKey = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const stored = localStorage.getItem(`scratchpad-${dateKey}`);
    setScratchpadContent(stored || JSON.stringify({
      id: 'root',
      content: '',
      children: []
    }));
  }, [selectedDate]);

  // Week navigation utilities (now imported from dateUtils)

  const navigateWeek = (direction) => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + direction * 7);
    setCurrentWeekStart(newWeekStart);
  };

  const getTasksForDate = (date) => {
    const dateString = toDateKey(date);
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
      const newDueDate = targetDate ? toDateKey(targetDate) : null;
      setTodoistTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, due: newDueDate } : task,
        ),
      );

      // Handle reordering and cross-column positioning
      if (targetDate && insertPosition !== null) {
        const dateKey = toDateKey(targetDate);
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
          const dateString = toDateKey(targetDate);
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

  // Modal components now imported from separate files

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
      const dateKey = toDateKey(date);
      const dayTasks = getTasksForDate(date);
      const dayEvents = googleCalendarEvents.filter((event) => {
        const eventDate = new Date(event.start);
        return toDateKey(eventDate) === dateKey;
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
      const dateKey = toDateKey(date);
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
      const dateKey = toDateKey(date);
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

          const filteredUnscheduledTasks = filterUnscheduledTasks(
            tasks,
            taskFilter,
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
                      Unscheduled Tasks ({filteredUnscheduledTasks.length})
                    </h3>
                    {filteredUnscheduledTasks.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        No unscheduled tasks
                      </p>
                    ) : (
                      filteredUnscheduledTasks.map((task, index) => (
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
      const dateKey = toDateKey(date);
      const dayTasks = getTasksForDate(date);
      const dayRecipes = scheduledRecipes[dateKey] || { lunch: [], dinner: [] };
      const dayWorkouts = scheduledWorkouts[dateKey] || [];
      const dayEvents = googleCalendarEvents.filter((event) => {
        const eventDate = new Date(event.start);
        return toDateKey(eventDate) === dateKey;
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
            const dateKey = toDateKey(date);
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
            const dateKey = toDateKey(date);
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
            const dateKey = toDateKey(date);
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
            const dateKey = toDateKey(date);
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

  // Add the missing Google Calendar functions
  const fetchGoogleCalendarEvents = useCallback(
    async (token) => {
      if (!token) return;

      setLoadingGoogleCalendarEvents(true);
      setGoogleCalendarError(null);
      try {
        const events = await GoogleCalendarService.getEvents(
          token,
          new Date(currentWeekStart),
          new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
        );
        setGoogleCalendarEvents(events);
        localStorage.setItem("googleCalendarToken", token);
      } catch (error) {
        setGoogleCalendarError(error);
        console.error("Failed to fetch Google Calendar events:", error);
      } finally {
        setLoadingGoogleCalendarEvents(false);
      }
    },
    [currentWeekStart, setLoadingGoogleCalendarEvents, setGoogleCalendarError]
  );

  const handleGoogleAuthClick = async () => {
    try {
      const token = await GoogleCalendarService.handleAuthClick();
      setGoogleCalendarToken(token);
      fetchGoogleCalendarEvents(token);
    } catch (error) {
      setGoogleCalendarError(error);
      console.error("Google authentication failed:", error);
    }
  };

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
            setScratchpadContent={(content) => {
              setScratchpadContent(content);
              const dateKey = selectedDate.toLocaleDateString('en-CA');
              localStorage.setItem(`scratchpad-${dateKey}`, content);
            }}
            handleTaskCompletionToggle={handleTaskCompletionToggle}
            scheduledRecipes={scheduledRecipes}
            scheduledWorkouts={scheduledWorkouts}
            dayTaskFilter={dayTaskFilter}
            setDayTaskFilter={setDayTaskFilter}
            setShowAddTaskModal={setShowAddTaskModal}
            setEditingTask={setEditingTask}
            setShowEditTaskModal={setShowEditTaskModal}
            editingTask={editingTask}
            showEditTaskModal={showEditTaskModal}
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
            claudeApiKey={claudeApiKey}
            setClaudeApiKey={setClaudeApiKey}
            handleSaveClaudeApiKey={handleSaveClaudeApiKey}
            claudeApiError={claudeApiError}
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
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
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
                    if (
                      Array.isArray(
                        newScheduled[existingDateKey][existingMealType],
                      )
                    ) {
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

            if (DEBUG) console.log("Updated scheduled recipes:", newScheduled);
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
        if (
          parts.length >= 4 &&
          (parts[3] === "lunch" || parts[3] === "dinner")
        ) {
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
                    if (
                      Array.isArray(
                        newScheduled[existingDateKey][existingMealType],
                      )
                    ) {
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
            const destDate = parseDateKey(destination.droppableId);
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
        const destDate = parseDateKey(destination.droppableId);
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
    [
      plannerMode,
      setScheduledRecipes,
      setScheduledWorkouts,
      handleTaskDrop,
    ],
  );

  // Prepare app state and actions for Claude integration
  const appState = {
    activeView,
    selectedDate,
    tasks,
    scheduledRecipes,
    scheduledWorkouts,
    scratchpadContent,
    dayTaskFilter,
    activeFilters,
    taskFilter,
    todoistToken,
    googleCalendarToken,
    availableProjects,
    currentWeekStart
  };

  const appActions = {
    setActiveView,
    setSelectedDate,
    setScratchpadContent,
    setDayTaskFilter,
    setActiveFilters,
    setTaskFilter,
    setScheduledRecipes,
    setScheduledWorkouts,
    handleAddTask,
    handleEditTask,
    handleDeleteTask,
    handleTaskCompletionToggle,
    fetchTodoistTasks,
    navigateWeek: navigateWeek
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {renderContent()}
          </main>
        </div>

        {/* Modals */}
        {showEditTaskModal && editingTask && (
          <EditTaskModal
            task={editingTask}
            onSave={handleEditTask}
            onClose={() => {
              setShowEditTaskModal(false);
              setEditingTask(null);
            }}
          />
        )}

        {showEditEventModal && editingEvent && (
          <EditEventModal
            event={editingEvent}
            onSave={(eventId, updates) => {
              // Handle event updates here
              console.log("Event update:", eventId, updates);
              setShowEditEventModal(false);
              setEditingEvent(null);
            }}
            onClose={() => {
              setShowEditEventModal(false);
              setEditingEvent(null);
            }}
          />
        )}
      </div>
    </DragDropContext>
  );
}

export default App;
