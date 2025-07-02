import { isTaskOverdue, isTaskDueToday, isTaskDueThisWeek } from './dateUtils';

export const getFilteredTasks = (tasks, activeFilters, selectedProjects) => {
  let filtered = [...tasks];

  // Always exclude shopping list project by default (unless specifically selected)
  if (!selectedProjects.has('shopping_list') && !activeFilters.has('shopping_list')) {
    filtered = filtered.filter(task => 
      !task.project_name || 
      task.project_name.toLowerCase() !== 'shopping list'
    );
  }

  // Apply date-based filters
  if (activeFilters.has('today')) {
    filtered = filtered.filter(task => isTaskDueToday(task) || !task.due);
  }
  if (activeFilters.has('week')) {
    filtered = filtered.filter(task => isTaskDueThisWeek(task) || !task.due);
  }
  if (activeFilters.has('overdue')) {
    filtered = filtered.filter(task => isTaskOverdue(task));
  }

  // Apply custom project filters
  if (activeFilters.has('bridge_club')) {
    filtered = filtered.filter(task => 
      task.project_name && task.project_name.toLowerCase().includes('bridge club')
    );
  }
  if (activeFilters.has('home')) {
    filtered = filtered.filter(task => 
      task.project_name && task.project_name.toLowerCase() === 'home'
    );
  }
  if (activeFilters.has('cooking')) {
    filtered = filtered.filter(task => 
      task.project_name && task.project_name.toLowerCase() === 'meal_planning'
    );
  }

  // Apply project filters
  if (selectedProjects.size > 0) {
    filtered = filtered.filter(task => 
      selectedProjects.has(task.project_id) || 
      selectedProjects.has('inbox')
    );
  }

  // If 'all' is the only active filter, return everything (minus shopping list)
  if (activeFilters.size === 1 && activeFilters.has('all')) {
    return filtered;
  }

  return filtered;
};

export const getSortedTasks = (filteredTasks, sortBy) => {
  let sorted = [...filteredTasks];

  switch (sortBy) {
    case 'date':
      sorted.sort((a, b) => {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return new Date(a.due) - new Date(b.due);
      });
      break;
    case 'priority':
      sorted.sort((a, b) => (b.priority || 1) - (a.priority || 1));
      break;
    case 'alphabetical':
      sorted.sort((a, b) => (a.content || a.title || '').localeCompare(b.content || b.title || ''));
      break;
    default:
      // 'default' - keep original order
      break;
  }

  return sorted;
};

export const getGroupedTasks = (sortedTasks, groupBy) => {
  if (groupBy === 'none') {
    return { 'All Tasks': sortedTasks };
  }

  const groups = {};

  sortedTasks.forEach(task => {
    let groupKey;
    
    switch (groupBy) {
      case 'priority':
        groupKey = task.priority ? `Priority ${task.priority}` : 'No Priority';
        break;
      case 'project':
        groupKey = task.project_name || 'No Project';
        break;
      case 'date':
        if (!task.due) {
          groupKey = 'No Due Date';
        } else if (isTaskOverdue(task)) {
          groupKey = 'Overdue';
        } else if (isTaskDueToday(task)) {
          groupKey = 'Today';
        } else if (isTaskDueThisWeek(task)) {
          groupKey = 'This Week';
        } else {
          groupKey = 'Later';
        }
        break;
      default:
        groupKey = 'All Tasks';
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(task);
  });

  return groups;
};

export const getUnscheduledTasks = (tasks, taskFilter) => {
  let filteredTasks = tasks.filter(task => 
    task.source === 'todoist' && 
    !task.completed && 
    !task.due && // Only truly unscheduled tasks (no due date)
    (!task.project_name || task.project_name.toLowerCase() !== 'shopping list')
  );

  switch (taskFilter) {
    case 'bridge_club':
      filteredTasks = filteredTasks.filter(task => 
        task.project_name && task.project_name.toLowerCase().includes('bridge club')
      );
      break;
    case 'home':
      filteredTasks = filteredTasks.filter(task => 
        task.project_name && task.project_name.toLowerCase() === 'home'
      );
      break;
    case 'urgent':
      filteredTasks = filteredTasks.filter(task => task.priority === 4);
      break;
    case 'all':
    default:
      // No additional filtering needed for 'all'
      break;
  }
  return filteredTasks;
};

export const getTasksForDate = (tasks, date, taskOrder) => {
  const dateString = date.toISOString().split('T')[0];
  const dayTasks = tasks.filter(task => 
    task.due && 
    task.due.startsWith(dateString) &&
    !task.completed
  );
  
  // Apply custom ordering if it exists
  const order = taskOrder[dateString];
  if (order && order.length > 0) {
    const orderedTasks = [];
    const unorderedTasks = [];
    
    // First, add tasks in the specified order
    order.forEach(taskId => {
      const task = dayTasks.find(t => t.id === taskId);
      if (task) {
        orderedTasks.push(task);
      }
    });
    
    // Then add any tasks that aren't in the order (new tasks)
    dayTasks.forEach(task => {
      if (!order.includes(task.id)) {
        unorderedTasks.push(task);
      }
    });
    
    return [...orderedTasks, ...unorderedTasks];
  }
  
  return dayTasks;
};

export const toggleFilter = (filterKey, activeFilters, setActiveFilters, setSelectedProjects, event) => {
  const isCtrlClick = event?.ctrlKey || event?.metaKey;
  
  if (filterKey === 'all') {
    setActiveFilters(new Set(['all']));
    setSelectedProjects(new Set());
  } else if (isCtrlClick) {
    // Ctrl+click: additive filtering
    const newFilters = new Set(activeFilters);
    newFilters.delete('all'); // Remove 'all' when selecting specific filters
    
    if (newFilters.has(filterKey)) {
      newFilters.delete(filterKey);
    } else {
      newFilters.add(filterKey);
    }
    
    // If no filters left, add 'all' back
    if (newFilters.size === 0) {
      newFilters.add('all');
    }
    
    setActiveFilters(newFilters);
  } else {
    // Normal click: exclusive filtering
    setActiveFilters(new Set([filterKey]));
    setSelectedProjects(new Set());
  }
};
