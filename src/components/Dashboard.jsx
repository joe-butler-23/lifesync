import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Calendar, CheckSquare, Plus, Utensils, Dumbbell, MessageCircle } from 'lucide-react';
import OutlinerEditor from './OutlinerEditor';
import { mockRecipes, mockWorkouts } from '../constants/mockData';

function Dashboard({
  currentView,
  weekDates,
  currentWeekStart,
  unscheduledTasks,
  tasks,
  getTasksForDate,
  scratchpadContent,
  setScratchpadContent,
  handleTaskCompletionToggle,
  scheduledRecipes = {},
  setScheduledRecipes,
  scheduledWorkouts = {},
  setScheduledWorkouts,
  selectedDate,
  setSelectedDate,
  setShowAddTaskModal
}) {


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

    if (selectedDate.toDateString() === today.toDateString()) return "Today";
    if (selectedDate.toDateString() === yesterday.toDateString())
      return "Yesterday";
    if (selectedDate.toDateString() === tomorrow.toDateString())
      return "Tomorrow";
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  // Filter tasks based on dayTaskFilter
  const [dayTaskFilter, setDayTaskFilter] = useState('all');

  // Get data for selected date
  const selectedDateKey = selectedDate.toISOString().split("T")[0];
  const dayTasks = getTasksForDate(selectedDate);
  const dayRecipes = scheduledRecipes[selectedDateKey] || {
    lunch: [],
    dinner: [],
  };
  const dayWorkouts = scheduledWorkouts[selectedDateKey] || [];

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
  const [showDatePicker, setShowDatePicker] = useState(false);
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
              {/* <ClaudeButton 
                component="Dashboard"
                componentState={{
                  selectedDate: formatSelectedDate(),
                  tasksCount: filteredDayTasks.length,
                  workoutsCount: dayWorkouts.length,
                  mealsPlanned: dayRecipes.lunch.length + dayRecipes.dinner.length
                }}
              /> */}
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
                  const workout = mockWorkouts.find((w) => w.id === workoutId);
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
                      const recipe = mockRecipes.find((r) => r.id === recipeId);
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
                      const recipe = mockRecipes.find((r) => r.id === recipeId);
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
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {filteredDayTasks.length} tasks
                </span>
                <button
                  onClick={() => setShowAddTaskModal && setShowAddTaskModal(true)}
                  className="p-1 rounded-full hover:bg-gray-200 text-blue-600"
                  title="Add Task"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Task Filter Buttons */}
            {setDayTaskFilter && (
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
            )}

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
                    className="p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          className="mr-3 mt-1 rounded"
                          checked={task.completed}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleTaskCompletionToggle(task.id, task.completed);
                          }}
                        />
                        <div>
                          <p
                            className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-blue-900"}`}
                          >
                            {task.content || task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-blue-700 mt-1 opacity-75">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 text-xs mt-1">
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
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
                Scratchpad
              </h3>
              <span className="text-sm text-gray-500">
                Notes for {formatSelectedDate()}
              </span>
            </div>
            <div className="h-[300px] border-t bg-white">
              <OutlinerEditor
                content={scratchpadContent}
                onChange={setScratchpadContent}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;