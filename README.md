# Life Dashboard

A React-based dashboard for integrating Google Calendar and Todoist tasks.

## Environment Variables

The application expects the following environment variables to be defined:

- `REACT_APP_GOOGLE_CLIENT_ID` – OAuth client ID for Google Calendar.
- `REACT_APP_GOOGLE_API_KEY` – Google API key used for initializing the client.

Create a `.env` file in the project root and add these keys before running the app:

```bash
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_GOOGLE_API_KEY=your-google-api-key
```

## Development

Install dependencies and start the development server:

```bash
npm install
npm start
```
