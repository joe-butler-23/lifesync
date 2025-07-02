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

export const getWeekDates = (startDate) => {
  const dates = [];
  const current = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export const formatWeekRange = (startDate) => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const options = { month: 'short', day: 'numeric' };
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
};

export const getCurrentWeekStart = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(today.setDate(diff));
};

export const isTaskOverdue = (task) => {
  if (!task.due) return false;
  const dueDate = new Date(task.due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today && !task.completed;
};

export const isTaskDueToday = (task) => {
  if (!task.due) return false;
  const dueDate = new Date(task.due);
  const today = new Date();
  return dueDate.toDateString() === today.toDateString();
};

export const isTaskDueThisWeek = (task) => {
  if (!task.due) return false;
  const dueDate = new Date(task.due);
  const today = new Date();
  const weekFromNow = new Date(today);
  weekFromNow.setDate(today.getDate() + 7);
  return dueDate >= today && dueDate <= weekFromNow;
};