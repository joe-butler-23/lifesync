import { getFilteredTasks } from './taskUtils';

describe('getFilteredTasks', () => {
  test('filters tasks due today', () => {
    const today = new Date();
    const tasks = [
      { id: 1, due: today.toISOString(), completed: false },
      { id: 2, due: new Date(today.getTime() - 86400000).toISOString(), completed: false },
      { id: 3, due: null, completed: false }
    ];

    const result = getFilteredTasks(tasks, new Set(['today']), new Set());

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});
