const API_BASE_URL = 'https://api.todoist.com/rest/v2';

class TodoistService {
  static async getTasks(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('TodoistService.getTasks error:', error);
      throw new Error(`Network error: ${error.message}`);
    }
  }

  static async getProjects(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('TodoistService.getProjects error:', error);
      throw new Error(`Network error: ${error.message}`);
    }
  }

  static async addTask(token, taskData) {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      throw new Error(`Failed to add task: ${response.statusText}`);
    }

    return response.json();
  }

  static async updateTask(token, taskId, updates) {
    // Map our internal field names to Todoist API field names
    const todoistUpdates = {};
    
    if (updates.content !== undefined) todoistUpdates.content = updates.content;
    if (updates.description !== undefined) todoistUpdates.description = updates.description;
    if (updates.priority !== undefined) todoistUpdates.priority = updates.priority;
    if (updates.due !== undefined) todoistUpdates.due_string = updates.due;
    if (updates.project_id !== undefined) todoistUpdates.project_id = updates.project_id;
    if (updates.labels !== undefined) todoistUpdates.labels = updates.labels;

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(todoistUpdates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.statusText}`);
    }

    return response.json();
  }

  static async deleteTask(token, taskId) {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.statusText}`);
    }
  }

  static async completeTask(token, taskId) {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/close`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to complete task: ${response.statusText}`);
    }
  }
}

export default TodoistService;