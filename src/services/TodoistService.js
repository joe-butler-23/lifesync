// src/services/TodoistService.js

const API_BASE_URL = 'https://api.todoist.com/rest/v2';

const TodoistService = {
  /**
   * Fetches all active tasks from Todoist.
   * @param {string} token - The Todoist API token.
   * @returns {Promise<Array>} A promise that resolves to an array of tasks.
   */
  getTasks: async (token) => {
    if (!token) {
      throw new Error("Todoist API token is required.");
    }
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const tasks = await response.json();
      return tasks;
    } catch (error) {
      console.error("Error fetching Todoist tasks:", error);
      throw error;
    }
  },

  /**
   * Adds a new task to Todoist.
   * @param {string} token - The Todoist API token.
   * @param {object} task - The task object to add.
   * @returns {Promise<object>} A promise that resolves to the created task.
   */
  addTask: async (token, task) => {
    if (!token) {
      throw new Error("Todoist API token is required.");
    }
    if (!task || !task.content) {
      throw new Error("Task content is required.");
    }

    try {
      const requestBody = {
        content: task.content
      };

      // Add optional fields only if they exist
      if (task.project_id) {
        requestBody.project_id = task.project_id;
      }
      if (task.due_string) {
        requestBody.due_string = task.due_string;
      }
      if (task.priority && task.priority > 1) {
        requestBody.priority = task.priority;
      }

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add task: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const createdTask = await response.json();
      return createdTask; 
    } catch (error) {
      console.error("Error adding Todoist task:", error);
      throw error;
    }
  },

  /**
   * Updates an existing task in Todoist.
   * @param {string} token - The Todoist API token.
   * @param {string} taskId - The ID of the task to update.
   * @param {object} updates - An object containing the fields to update.
   * @returns {Promise<void>} A promise that resolves when the task is updated.
   */
  updateTask: async (token, taskId, updates) => {
    if (!token) {
      throw new Error("Todoist API token is required.");
    }
    if (!taskId) {
      throw new Error("Task ID is required for update.");
    }
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error("Updates object cannot be empty.");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update task: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error("Error updating Todoist task:", error);
      throw error;
    }
  },

  /**
   * Completes a task in Todoist.
   * @param {string} token - The Todoist API token.
   * @param {string} taskId - The ID of the task to complete.
   * @returns {Promise<void>} A promise that resolves when the task is completed.
   */
  completeTask: async (token, taskId) => {
    if (!token) {
      throw new Error("Todoist API token is required.");
    }
    if (!taskId) {
      throw new Error("Task ID is required to complete.");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to complete task: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error("Error completing Todoist task:", error);
      throw error;
    }
  },

  /**
   * Deletes a task from Todoist.
   * @param {string} token - The Todoist API token.
   * @param {string} taskId - The ID of the task to delete.
   * @returns {Promise<void>} A promise that resolves when the task is deleted.
   */
  deleteTask: async (token, taskId) => {
    if (!token) {
      throw new Error("Todoist API token is required.");
    }
    if (!taskId) {
      throw new Error("Task ID is required to delete.");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete task: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error("Error deleting Todoist task:", error);
      throw error;
    }
  },

  /**
   * Fetches all projects from Todoist.
   * @param {string} token - The Todoist API token.
   * @returns {Promise<Array>} A promise that resolves to an array of projects.
   */
  getProjects: async (token) => {
    if (!token) {
      throw new Error("Todoist API token is required.");
    }
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const projects = await response.json();
      return projects;
    } catch (error) {
      console.error("Error fetching Todoist projects:", error);
      throw error;
    }
  }
};

export default TodoistService;
