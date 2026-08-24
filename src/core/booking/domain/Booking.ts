import { DateTime } from 'luxon';
import { Attendee } from './Attendee';
import { Duration } from './Duration';
import { TimeSlot } from './TimeSlot';

export type BookingStatus = 'confirmed' | 'cancelled';

export interface BookingSnapshot {
  id: string;
  reference: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  status: BookingStatus;
  attendeeName: string;
  attendeeEmail: string;
  topic: string | null;
  note: string | null;
  attendeeTimezone: string;
  calendarEventId: string | null;
  meetingUrl: string | null;
  createdAt: string;
}

/**
 * Aggregate root for a booked session.
 *
 * State changes go through methods (`attachCalendarEvent`, `cancel`) rather than
 * public setters, so a Booking can never be half-updated. Persistence talks to
 * this class only through {@link toSnapshot} / {@link fromSnapshot}, which keeps
 * the storage schema swappable.
 */
export class Booking {
  private constructor(
    readonly id: string,
    readonly reference: string,
    readonly slot: TimeSlot,
    readonly duration: Duration,
    readonly attendee: Attendee,
    private _status: BookingStatus,
    private _calendarEventId: string | null,
    private _meetingUrl: string | null,
    readonly createdAt: DateTime,
  ) {}

  static schedule(params: {
    id: string;
    reference: string;
    slot: TimeSlot;
    attendee: Attendee;
    createdAt?: DateTime;
  }): Booking {
    return new Booking(
      params.id,
      params.reference,
      params.slot,
      Duration.of(params.slot.durationMinutes),
      params.attendee,
      'confirmed',
      null,
      null,
      params.createdAt ?? DateTime.utc(),
    );
  }

  get status(): BookingStatus {
    return this._status;
  }

  get calendarEventId(): string | null {
    return this._calendarEventId;
  }

  get meetingUrl(): string | null {
    return this._meetingUrl;
  }

  get isActive(): boolean {
    return this._status === 'confirmed';
  }

  /** Called once the calendar round-trip succeeds. */
  attachCalendarEvent(eventId: string, meetingUrl?: string | null): void {
    this._calendarEventId = eventId;
    this._meetingUrl = meetingUrl ?? null;
  }

  cancel(): void {
    this._status = 'cancelled';
  }

  /** Human-facing title used for the calendar event. */
  get title(): string {
    const topic = this.attendee.topic ? ` — ${this.attendee.topic}` : '';
    return `${this.duration.label} with ${this.attendee.name}${topic}`;
  }

  toSnapshot(): BookingSnapshot {
    return {
      id: this.id,
      reference: this.reference,
      startsAt: this.slot.start.toISO()!,
      endsAt: this.slot.end.toISO()!,
      durationMinutes: this.duration.minutes,
      status: this._status,
      attendeeName: this.attendee.name,
      attendeeEmail: this.attendee.email,
      topic: this.attendee.topic,
      note: this.attendee.note,
      attendeeTimezone: this.attendee.timezone,
      calendarEventId: this._calendarEventId,
      meetingUrl: this._meetingUrl,
      createdAt: this.createdAt.toISO()!,
    };
  }

  static fromSnapshot(snapshot: BookingSnapshot): Booking {
    const booking = new Booking(
      snapshot.id,
      snapshot.reference,
      TimeSlot.fromISO(snapshot.startsAt, snapshot.endsAt),
      Duration.of(snapshot.durationMinutes),
      Attendee.create({
        name: snapshot.attendeeName,
        email: snapshot.attendeeEmail,
        topic: snapshot.topic,
        note: snapshot.note,
        timezone: snapshot.attendeeTimezone,
      }),
      snapshot.status,
      snapshot.calendarEventId,
      snapshot.meetingUrl,
      DateTime.fromISO(snapshot.createdAt),
    );
    return booking;
  }
}
