import { google, type calendar_v3 } from 'googleapis';
import { DateTime } from 'luxon';
import type { Booking } from '@/core/booking/domain/Booking';
import { CalendarUnavailableError } from '@/core/booking/domain/errors';
import { TimeSlot } from '@/core/booking/domain/TimeSlot';
import type { CalendarPort } from '@/core/booking/ports';

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
  ownerEmail: string;
  ownerTimezone: string;
  /** Ask Google to attach a Meet link to every event. */
  createMeetLink: boolean;
}

/**
 * Google Calendar adapter.
 *
 * Uses OAuth2 with a long-lived refresh token for Richie's own account — a plain
 * API key cannot read a private calendar's free/busy, and a service account cannot
 * send invites from a consumer Gmail address without domain-wide delegation.
 *
 * Only free/busy is ever read. Event titles, attendees, and descriptions on the
 * owner's calendar are never fetched, so nothing private can leak into the UI.
 */
export class GoogleCalendarAdapter implements CalendarPort {
  readonly name = 'google-calendar';
  readonly isLive = true;

  private client: calendar_v3.Calendar | null = null;

  constructor(private readonly config: GoogleCalendarConfig) {}

  /** Returns null when credentials are absent, so the container can fall back. */
  static fromEnv(env: NodeJS.ProcessEnv = process.env): GoogleCalendarAdapter | null {
    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    const refreshToken = env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) return null;

    return new GoogleCalendarAdapter({
      clientId,
      clientSecret,
      refreshToken,
      calendarId: env.GOOGLE_CALENDAR_ID || 'primary',
      ownerEmail: env.BOOKING_OWNER_EMAIL || '',
      ownerTimezone: env.BOOKING_TIMEZONE || 'Asia/Singapore',
      createMeetLink: env.GOOGLE_CREATE_MEET_LINK !== 'false',
    });
  }

  private calendar(): calendar_v3.Calendar {
    if (this.client) return this.client;

    const auth = new google.auth.OAuth2(this.config.clientId, this.config.clientSecret);
    auth.setCredentials({ refresh_token: this.config.refreshToken });

    this.client = google.calendar({ version: 'v3', auth });
    return this.client;
  }

  async busyIntervals(from: DateTime, to: DateTime): Promise<TimeSlot[]> {
    try {
      const response = await this.calendar().freebusy.query({
        requestBody: {
          timeMin: from.toUTC().toISO()!,
          timeMax: to.toUTC().toISO()!,
          timeZone: 'UTC',
          items: [{ id: this.config.calendarId }],
        },
      });

      const periods = response.data.calendars?.[this.config.calendarId]?.busy ?? [];

      return periods.flatMap((period) => {
        if (!period.start || !period.end) return [];
        try {
          return [TimeSlot.fromISO(period.start, period.end)];
        } catch {
          return [];
        }
      });
    } catch (error) {
      throw new CalendarUnavailableError(
        `Could not read calendar availability: ${(error as Error).message}`,
      );
    }
  }

  async createEvent(booking: Booking): Promise<{ eventId: string; meetingUrl: string | null }> {
    const { attendee } = booking;

    const requestBody: calendar_v3.Schema$Event = {
      summary: booking.title,
      description: this.describe(booking),
      start: { dateTime: booking.slot.start.toISO()!, timeZone: 'UTC' },
      end: { dateTime: booking.slot.end.toISO()!, timeZone: 'UTC' },
      attendees: [
        { email: attendee.email, displayName: attendee.name, responseStatus: 'needsAction' },
        ...(this.config.ownerEmail
          ? [{ email: this.config.ownerEmail, organizer: true, responseStatus: 'accepted' }]
          : []),
      ],
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
      extendedProperties: {
        private: { bookingReference: booking.reference, source: 'richiekoh.dev' },
      },
      ...(this.config.createMeetLink
        ? {
            conferenceData: {
              createRequest: {
                requestId: booking.id,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
          }
        : {}),
    };

    try {
      const response = await this.calendar().events.insert({
        calendarId: this.config.calendarId,
        requestBody,
        // `all` is what actually emails the invite to the attendee.
        sendUpdates: 'all',
        conferenceDataVersion: this.config.createMeetLink ? 1 : 0,
      });

      const eventId = response.data.id;
      if (!eventId) {
        throw new CalendarUnavailableError('Google accepted the event but returned no id.');
      }

      return { eventId, meetingUrl: response.data.hangoutLink ?? null };
    } catch (error) {
      if (error instanceof CalendarUnavailableError) throw error;
      throw new CalendarUnavailableError(
        `Could not create the calendar event: ${(error as Error).message}`,
      );
    }
  }

  async cancelEvent(eventId: string): Promise<void> {
    try {
      await this.calendar().events.delete({
        calendarId: this.config.calendarId,
        eventId,
        sendUpdates: 'all',
      });
    } catch (error) {
      throw new CalendarUnavailableError(
        `Could not cancel the calendar event: ${(error as Error).message}`,
      );
    }
  }

  private describe(booking: Booking): string {
    const { attendee } = booking;
    const localStart = booking.slot.start
      .setZone(attendee.timezone)
      .toFormat("cccc d LLLL yyyy 'at' h:mm a (ZZZZ)");

    return [
      `Booked via richiekoh.dev — reference ${booking.reference}`,
      '',
      `Name:      ${attendee.name}`,
      `Email:     ${attendee.email}`,
      attendee.topic ? `Topic:     ${attendee.topic}` : null,
      `Their time: ${localStart}`,
      '',
      attendee.note ? `Notes:\n${attendee.note}` : null,
    ]
      .filter((line) => line !== null)
      .join('\n');
  }
}
