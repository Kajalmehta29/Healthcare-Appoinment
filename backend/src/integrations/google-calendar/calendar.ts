import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5050/api/auth/google/callback';

const createOAuthClient = () => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return null;
  }
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
};

/**
 * Generate Auth URL for OAuth2 Flow
 */
export const getGoogleAuthUrl = (userId: string): string | null => {
  const oauth2Client = createOAuthClient();
  if (!oauth2Client) return null;

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: userId, // Pass userId in state to associate on callback
  });
};

/**
 * Handle OAuth Callback and Save Tokens
 */
export const handleGoogleCallback = async (userId: string, code: string) => {
  const oauth2Client = createOAuthClient();
  if (!oauth2Client) throw new Error('Google OAuth credentials not configured.');

  const { tokens } = await oauth2Client.getToken(code);
  
  await prisma.googleOauth.upsert({
    where: { userId },
    update: {
      accessToken: tokens.access_token || '',
      refreshToken: tokens.refresh_token || undefined,
      expiryDate: tokens.expiry_date ? String(tokens.expiry_date) : null,
    },
    create: {
      userId,
      accessToken: tokens.access_token || '',
      refreshToken: tokens.refresh_token || null,
      expiryDate: tokens.expiry_date ? String(tokens.expiry_date) : null,
    },
  });

  return tokens;
};

/**
 * Load Token and Setup Authenticated client
 */
const getAuthenticatedClient = async (userId: string) => {
  const oauth2Client = createOAuthClient();
  if (!oauth2Client) return null;

  const dbOauth = await prisma.googleOauth.findUnique({
    where: { userId },
  });

  if (!dbOauth) return null;

  oauth2Client.setCredentials({
    access_token: dbOauth.accessToken,
    refresh_token: dbOauth.refreshToken || undefined,
    expiry_date: dbOauth.expiryDate ? Number(dbOauth.expiryDate) : undefined,
  });

  // Handle Token Expiry
  if (dbOauth.expiryDate && Number(dbOauth.expiryDate) < Date.now() && dbOauth.refreshToken) {
    console.log('Refreshing expired Google Calendar access token for user:', userId);
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await prisma.googleOauth.update({
        where: { userId },
        data: {
          accessToken: credentials.access_token || '',
          expiryDate: credentials.expiry_date ? String(credentials.expiry_date) : null,
        },
      });
      oauth2Client.setCredentials(credentials);
    } catch (err) {
      console.error('Google token refresh failed:', err);
      return null;
    }
  }

  return oauth2Client;
};

/**
 * Create Google Calendar Event
 */
export const createCalendarEvent = async (
  appointmentId: string,
  userId: string, // User ID of either patient or doctor who authenticated
  details: {
    summary: string;
    description: string;
    startIso: string;
    endIso: string;
    attendees: string[];
  }
): Promise<string | null> => {
  try {
    let auth = await getAuthenticatedClient(userId);
    if (!auth) {
      // Fallback: Check if the other participant of the appointment has linked their calendar
      const apt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true, patient: true },
      });
      if (apt) {
        const otherUserId = userId === apt.doctor?.userId ? apt.patient?.userId : apt.doctor?.userId;
        if (otherUserId) {
          console.log(`Google Calendar client not authenticated for user ${userId}. Trying other participant ${otherUserId}...`);
          auth = await getAuthenticatedClient(otherUserId);
        }
      }
    }

    if (!auth) {
      console.warn(`No Google Calendar client authenticated for appointment ${appointmentId}. Skipping event creation.`);
      return null;
    }

    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: details.summary,
        description: details.description,
        start: { dateTime: details.startIso, timeZone: 'UTC' },
        end: { dateTime: details.endIso, timeZone: 'UTC' },
        attendees: details.attendees.map(email => ({ email })),
      },
    });

    const eventId = response.data.id || null;
    if (eventId) {
      // Save mapping in database
      await prisma.calendarEvent.upsert({
        where: { appointmentId },
        update: { googleEventId: eventId, htmlLink: response.data.htmlLink },
        create: { appointmentId, googleEventId: eventId, htmlLink: response.data.htmlLink },
      });
      console.log(`Google Calendar Event created: ${eventId}`);
    }
    return eventId;
  } catch (error) {
    console.error('Google Calendar Event creation failed:', error);
    return null; // Gracefully continue booking if calendar fails
  }
};

/**
 * Update Google Calendar Event on Reschedule
 */
export const updateCalendarEvent = async (
  appointmentId: string,
  userId: string,
  startIso: string,
  endIso: string
): Promise<boolean> => {
  try {
    const calendarEvent = await prisma.calendarEvent.findUnique({
      where: { appointmentId },
    });
    if (!calendarEvent) return false;

    let auth = await getAuthenticatedClient(userId);
    if (!auth) {
      const apt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true, patient: true },
      });
      if (apt) {
        const otherUserId = userId === apt.doctor?.userId ? apt.patient?.userId : apt.doctor?.userId;
        if (otherUserId) {
          auth = await getAuthenticatedClient(otherUserId);
        }
      }
    }
    if (!auth) return false;

    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.patch({
      calendarId: 'primary',
      eventId: calendarEvent.googleEventId,
      requestBody: {
        start: { dateTime: startIso, timeZone: 'UTC' },
        end: { dateTime: endIso, timeZone: 'UTC' },
      },
    });

    console.log(`Google Calendar Event rescheduled: ${calendarEvent.googleEventId}`);
    return true;
  } catch (error) {
    console.error('Google Calendar Event update failed:', error);
    return false;
  }
};

/**
 * Delete Google Calendar Event
 */
export const deleteCalendarEvent = async (appointmentId: string, userId: string): Promise<boolean> => {
  try {
    const calendarEvent = await prisma.calendarEvent.findUnique({
      where: { appointmentId },
    });
    if (!calendarEvent) return false;

    let auth = await getAuthenticatedClient(userId);
    if (!auth) {
      const apt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true, patient: true },
      });
      if (apt) {
        const otherUserId = userId === apt.doctor?.userId ? apt.patient?.userId : apt.doctor?.userId;
        if (otherUserId) {
          auth = await getAuthenticatedClient(otherUserId);
        }
      }
    }
    if (!auth) return false;

    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: calendarEvent.googleEventId,
    });

    // Delete mapping
    await prisma.calendarEvent.delete({
      where: { appointmentId },
    });

    console.log(`Google Calendar Event deleted: ${calendarEvent.googleEventId}`);
    return true;
  } catch (error) {
    console.error('Google Calendar Event deletion failed:', error);
    return false;
  }
};
