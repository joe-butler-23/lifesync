# Life Dashboard

Life Dashboard is a React application that centralizes tasks, events, workouts and meals into a single planning interface. It integrates with Todoist, Google Calendar and an optional Claude AI assistant.

## Environment Variables

Create a `.env` file in the project root and define:

```
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_GOOGLE_API_KEY=your-google-api-key
# optional Anthropic API key
REACT_APP_ANTHROPIC_API_KEY=your-anthropic-key
```

## Development

1. Install dependencies
   ```bash
   npm install
   ```
2. Start the backend API (serves `/api/claude`)
   ```bash
   npm run server
   ```
3. In another terminal start the React dev server
   ```bash
   npm start
   ```

The React server proxies unknown requests to the backend so `/api/claude` works during development.

## Major Features

- **Todoist integration** – manage tasks directly from your Todoist account.
- **Google Calendar integration** – view and update calendar events.
- **Weekly planner** – drag tasks, recipes and workouts onto specific days.
- **Day planner** – see today's tasks, meals, workouts and a scratchpad.
- **Claude AI assistant** – conversational helper powered by Anthropic.

API keys can also be stored in the Settings screen.
