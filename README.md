# Life Dashboard

Life Dashboard is a React application that centralizes tasks, events, workouts and meals into a single planning interface. It integrates with Todoist for task management and Google Calendar for event scheduling. Drag and drop support lets you plan your week by arranging tasks, recipes and workouts on a calendar.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```

The application runs on port 3000 by default.

## Major Features

- **Todoist integration** – fetch, add and update tasks directly from your Todoist account.
- **Google Calendar integration** – view, edit and delete events from your Google Calendar after connecting with an access token.
- **Weekly planner** – drag tasks, recipes and workouts onto specific days of the week.
- **Day planner** – see today's tasks, meals, workouts and a scratchpad powered by Deepnotes for quick notes.
- **Filtering and sorting** – group tasks by date, project, priority or label and filter by custom categories.

Before using the integrations, update the API keys in `GoogleCalendarService.js` and supply your Todoist token in the settings screen.
