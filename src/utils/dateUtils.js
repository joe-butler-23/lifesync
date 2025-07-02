export const formatDateForTodoist = (dateInput) => {
  if (!dateInput) return '';
  
  const naturalLanguage = ['today', 'tomorrow', 'next monday', 'next tuesday', 'next wednesday', 
                         'next thursday', 'next friday', 'next saturday', 'next sunday', 'next week', 
                         'next month', 'this weekend'];
  
  if (naturalLanguage.some(phrase => dateInput.toLowerCase().includes(phrase))) {
    return dateInput;
  }
  
  const date = new Date(dateInput);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return dateInput;
};

export const getWeekDates = (weekStart) => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    dates.push(date);
  }
  return dates;
};

export const formatWeekRange = (weekStart) => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
};

export const getCurrentWeekStart = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(today.setDate(diff));
};

export const isTaskOverdue = (task) => {
  if (!task.due) return false;
  const today = new Date();
  const dueDate = new Date(task.due);
  return dueDate < today && !task.completed;
};

export const isTaskDueToday = (task) => {
  if (!task.due) return false;
  const today = new Date();
  const dueDate = new Date(task.due);
  return dueDate.toDateString() === today.toDateString();
};

export const isTaskDueThisWeek = (task) => {
  if (!task.due) return false;
  const today = new Date();
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dueDate = new Date(task.due);
  return dueDate >= today && dueDate <= weekFromNow;
};
