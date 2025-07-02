// src/services/GoogleCalendarService.js

const CLIENT_ID = '730873596773-49ppgpuppetg21jdgcbi02du3v7t8ofa.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAju8p21PbXEDjSQhNIDZ7Jm_Eo3B9C2YI';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

let gapiInited = false;
let gisInited = false;
let googleApiClient = null;

const GoogleCalendarService = {
  /**
   * Load the Google API client library.
   */
  loadGapi: () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client', () => {
          gapiInited = true;
          resolve();
        });
      };
      document.head.appendChild(script);
    });
  },

  /**
   * Load the Google Identity Services library.
   */
  loadGis: () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        gisInited = true;
        resolve();
      };
      document.head.appendChild(script);
    });
  },

  /**
   * Initialize the Google API client.
   */
  initClient: async () => {
    if (!gapiInited) {
      await GoogleCalendarService.loadGapi();
    }
    if (!gisInited) {
      await GoogleCalendarService.loadGis();
    }

    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    });

    googleApiClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // Will be set dynamically on request
    });
  },

  /**
   * Handle the Google Sign-In process and get an access token.
   */
  handleAuthClick: () => {
    return new Promise((resolve, reject) => {
      if (!googleApiClient) {
        reject(new Error("Google API client not initialized."));
        return;
      }
      
      googleApiClient.callback = (resp) => {
        if (resp.error) {
          reject(new Error(resp.error));
        } else {
          resolve(resp.access_token);
        }
      };
      googleApiClient.requestAccessToken();
    });
  },

  /**
   * Fetch events from the primary Google Calendar.
   * @param {string} accessToken - The Google API access token.
   * @param {Date} timeMin - The start date for fetching events.
   * @param {Date} timeMax - The end date for fetching events.
   * @returns {Promise<Array>} A promise that resolves to an array of calendar events.
   */
  getEvents: async (accessToken, timeMin, timeMax) => {
    if (!window.gapi || !window.gapi.client) {
      throw new Error("Google API client not loaded.");
    }
    if (!accessToken) {
      throw new Error("Google access token is required.");
    }

    window.gapi.client.setToken({ access_token: accessToken });

    try {
      const response = await window.gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': timeMin.toISOString(),
        'timeMax': timeMax.toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 100,
        'orderBy': 'startTime'
      });

      const events = response.result.items;
      return events.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        location: event.location,
        description: event.description,
        source: 'google-calendar'
      }));
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error);
      throw error;
    }
  },

  /**
   * Create a new event in Google Calendar.
   * @param {string} accessToken - The Google API access token.
   * @param {Object} eventData - Event data object.
   * @returns {Promise<Object>} A promise that resolves to the created event.
   */
  createEvent: async (accessToken, eventData) => {
    if (!window.gapi || !window.gapi.client) {
      throw new Error("Google API client not loaded.");
    }
    if (!accessToken) {
      throw new Error("Google access token is required.");
    }

    window.gapi.client.setToken({ access_token: accessToken });

    try {
      const response = await window.gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': eventData
      });

      return {
        id: response.result.id,
        title: response.result.summary,
        start: response.result.start.dateTime || response.result.start.date,
        end: response.result.end.dateTime || response.result.end.date,
        location: response.result.location,
        description: response.result.description,
        source: 'google-calendar'
      };
    } catch (error) {
      console.error("Error creating Google Calendar event:", error);
      throw error;
    }
  },

  /**
   * Update an existing event in Google Calendar.
   * @param {string} accessToken - The Google API access token.
   * @param {string} eventId - The ID of the event to update.
   * @param {Object} eventData - Updated event data object.
   * @returns {Promise<Object>} A promise that resolves to the updated event.
   */
  updateEvent: async (accessToken, eventId, eventData) => {
    if (!window.gapi || !window.gapi.client) {
      throw new Error("Google API client not loaded.");
    }
    if (!accessToken) {
      throw new Error("Google access token is required.");
    }

    window.gapi.client.setToken({ access_token: accessToken });

    try {
      const response = await window.gapi.client.calendar.events.update({
        'calendarId': 'primary',
        'eventId': eventId,
        'resource': eventData
      });

      return {
        id: response.result.id,
        title: response.result.summary,
        start: response.result.start.dateTime || response.result.start.date,
        end: response.result.end.dateTime || response.result.end.date,
        location: response.result.location,
        description: response.result.description,
        source: 'google-calendar'
      };
    } catch (error) {
      console.error("Error updating Google Calendar event:", error);
      throw error;
    }
  },

  /**
   * Delete an event from Google Calendar.
   * @param {string} accessToken - The Google API access token.
   * @param {string} eventId - The ID of the event to delete.
   * @returns {Promise<void>} A promise that resolves when the event is deleted.
   */
  deleteEvent: async (accessToken, eventId) => {
    if (!window.gapi || !window.gapi.client) {
      throw new Error("Google API client not loaded.");
    }
    if (!accessToken) {
      throw new Error("Google access token is required.");
    }

    window.gapi.client.setToken({ access_token: accessToken });

    try {
      await window.gapi.client.calendar.events.delete({
        'calendarId': 'primary',
        'eventId': eventId
      });
    } catch (error) {
      console.error("Error deleting Google Calendar event:", error);
      throw error;
    }
  }
};

export default GoogleCalendarService;
