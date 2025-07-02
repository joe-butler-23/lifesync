const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

class GoogleCalendarService {
  static gapi = null;

  static async initClient() {
    if (window.gapi) {
      this.gapi = window.gapi;
      await this.gapi.load('client:auth2', async () => {
        await this.gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: [DISCOVERY_DOC],
          scope: SCOPES
        });
      });
    } else {
      throw new Error('Google API not loaded');
    }
  }

  static async handleAuthClick() {
    if (!this.gapi) {
      throw new Error('Google API not initialized');
    }

    const authInstance = this.gapi.auth2.getAuthInstance();
    const user = await authInstance.signIn();
    return user.getAuthResponse().access_token;
  }

  static async getEvents(token, timeMin, timeMax) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        description: event.description || ''
      }));
    } catch (error) {
      throw new Error(`Failed to fetch Google Calendar events: ${error.message}`);
    }
  }

  static async updateEvent(token, eventId, eventData) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: eventData.title,
          start: { dateTime: eventData.start },
          end: { dateTime: eventData.end },
          description: eventData.description
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update event: ${response.statusText}`);
    }

    const updatedEvent = await response.json();
    return {
      id: updatedEvent.id,
      title: updatedEvent.summary,
      start: updatedEvent.start.dateTime || updatedEvent.start.date,
      end: updatedEvent.end.dateTime || updatedEvent.end.date,
      description: updatedEvent.description || ''
    };
  }

  static async deleteEvent(token, eventId) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete event: ${response.statusText}`);
    }
  }
}

export default GoogleCalendarService;