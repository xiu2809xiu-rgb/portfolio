import { DateTime } from 'luxon';
import { Attendee } from './Attendee';
import { Duration } from './Duration';
import { TimeSlot } from './TimeSlot';

/**
 * Where a booking sits in its lifecycle.
 *
 *   pending    someone has asked for the slot; it is held but not agreed
 *   confirmed  Richie approved it
 *   declined   Richie turned it down
 *   expired    Richie did not answer inside the approval window
 *   cancelled  called off after it was already confirmed
 *
 * `pending` and `confirmed` both hold the slot — that is the whole point of a
 * hold. The other three release it.
 */
export type BookingStatus = 'pending' | 'confirmed' | 'declined' | 'expired' | 'cancelled';

const SLOT_HOLDING: readonly BookingStatus[] = ['pending', 'confirmed'];

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
  /** Bearer token for the approve/decline links. Never shown to the attendee. */
  actionToken: string;
  /** When an unanswered request stops holding the slot. */
  holdExpiresAt: string;
}

/**
 * Aggregate root for a requested session.
 *
 * State changes go through methods (`approve`, `decline`, `expire`, `cancel`)
 * rather than public setters, so a Booking can never be half-updated, and an
 * illegal transition throws instead of silently corrupting the record.
 * Persistence talks to this class only through {@link toSnapshot} /
 * {@link fromSnapshot}, which keeps the storage schema swappable.
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
    readonly actionToken: string,
    readonly holdExpiresAt: DateTime,
  ) {}

  /**
   * A request for a slot — held, not agreed.
   *
   * Nothing here is a commitment on Richie's part. The visitor is told the slot
   * is held until `holdExpiresAt`, and it is his approval that turns it into a
   * meeting.
   */
  static request(params: {
    id: string;
    reference: string;
    slot: TimeSlot;
    attendee: Attendee;
    actionToken: string;
    holdExpiresAt: DateTime;
    createdAt?: DateTime;
  }): Booking {
    return new Booking(
      params.id,
      params.reference,
      params.slot,
      Duration.of(params.slot.durationMinutes),
      params.attendee,
      'pending',
      null,
      null,
      params.createdAt ?? DateTime.utc(),
      params.actionToken,
      params.holdExpiresAt,
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

  /** Holds the slot: nobody else may take this time. */
  get isActive(): boolean {
    return SLOT_HOLDING.includes(this._status);
  }

  get isPending(): boolean {
    return this._status === 'pending';
  }

  /** True once the approval window has passed without an answer. */
  hasLapsed(now: DateTime): boolean {
    return this._status === 'pending' && now >= this.holdExpiresAt;
  }

  /** Called once the calendar round-trip succeeds. */
  attachCalendarEvent(eventId: string, meetingUrl?: string | null): void {
    this._calendarEventId = eventId;
    this._meetingUrl = meetingUrl ?? null;
  }

  approve(): void {
    this.requirePending('approve');
    this._status = 'confirmed';
  }

  decline(): void {
    this.requirePending('decline');
    this._status = 'declined';
  }

  expire(): void {
    this.requirePending('expire');
    this._status = 'expired';
  }

  cancel(): void {
    this._status = 'cancelled';
  }

  /**
   * Guards the transitions that only make sense once.
   *
   * Without this, a second click on an approve link that has already been used —
   * a double-tap, a mail client prefetching, a browser replaying a POST — would
   * quietly re-run the whole flow and send the attendee a second confirmation.
   */
  private requirePending(action: string): void {
    if (this._status !== 'pending') {
      throw new Error(`Cannot ${action} a booking that is already ${this._status}.`);
    }
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
      actionToken: this.actionToken,
      holdExpiresAt: this.holdExpiresAt.toISO()!,
    };
  }

  static fromSnapshot(snapshot: BookingSnapshot): Booking {
    return new Booking(
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
      snapshot.actionToken,
      DateTime.fromISO(snapshot.holdExpiresAt),
    );
  }
}
