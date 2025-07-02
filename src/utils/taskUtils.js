import { isTaskOverdue, isTaskDueToday, isTaskDueThisWeek } from './dateUtils';

export const getFilteredTasks = (tasks, activeFilters, selectedProjects) => {
  let filtered = tasks.filter(task => 
    !task.project_name || task.project_name.toLowerCase() !== 'shopping list'
  );

  if (activeFilters.has('today')) {
    filtered = filtered.filter(task => isTaskDueToday(task));
  }
  if (activeFilters.has('week')) {
    filtered = filtered.filter(task => isTaskDueThisWeek(task));
  }
  if (activeFilters.has('overdue')) {
    filtered = filtered.filter(task => isTaskOverdue(task));
  }
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

  if (selectedProjects.size > 0) {
    filtered = filtered.filter(task => 
      task.project_id && selectedProjects.has(task.project_id)
    );
  }

  return filtered;
};

export const getSortedTasks = (tasks, sortBy) => {
  const sorted = [...tasks];

  switch (sortBy) {
    case 'date':
      return sorted.sort((a, b) => {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return new Date(a.due) - new Date(b.due);
      });
    case 'priority':
      return sorted.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    case 'alphabetical':
      return sorted.sort((a, b) => (a.content || a.title || '').localeCompare(b.content || b.title || ''));
    default:
      return sorted;
  }
};

export const getGroupedTasks = (tasks, groupBy) => {
  if (groupBy === 'none') {
    return { 'All Tasks': tasks };
  }

  const groups = {};

  tasks.forEach(task => {
    let groupKey;

    switch (groupBy) {
      case 'project':
        groupKey = task.project_name || 'No Project';
        break;
      case 'priority':
        groupKey = task.priority ? `Priority ${task.priority}` : 'No Priority';
        break;
      case 'date':
        if (isTaskOverdue(task)) {
          groupKey = 'Overdue';
        } else if (isTaskDueToday(task)) {
          groupKey = 'Today';
        } else if (isTaskDueThisWeek(task)) {
          groupKey = 'This Week';
        } else if (task.due) {
          groupKey = 'Later';
        } else {
          groupKey = 'No Due Date';
        }
        break;
      case 'label':
        if (task.labels && task.labels.length > 0) {
          groupKey = task.labels[0];
        } else {
          groupKey = 'No Label';
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