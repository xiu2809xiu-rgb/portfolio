import type { DateTime } from 'luxon';
import type { Booking } from '../domain/Booking';
import type { TimeSlot } from '../domain/TimeSlot';

/**
 * Ports — the interfaces the domain depends on.
 *
 * Services in `core/` are written against these only. Concrete adapters live in
 * `src/infrastructure/`, which means the domain has no idea whether the calendar
 * is Google or an in-memory stub, and can be unit-tested without either.
 */

/** Reads busy time and writes events on whichever calendar backs the site. */
export interface CalendarPort {
  /** Human-readable name shown on the health endpoint. */
  readonly name: string;

  /** True when real credentials are wired up; false for the fallback adapter. */
  readonly isLive: boolean;

  /** Every busy interval that intersects `[from, to)`. */
  busyIntervals(from: DateTime, to: DateTime): Promise<TimeSlot[]>;

  /**
   * Creates the event and returns its id plus any meeting link.
   *
   * A pending booking is written as *tentative*: it occupies the slot in
   * free/busy so nobody else can take it, without asserting that the meeting is
   * happening. {@link confirmEvent} promotes it once Richie approves.
   */
  createEvent(booking: Booking): Promise<{ eventId: string; meetingUrl: string | null }>;

  /** Promotes a held event to confirmed and invites the attendee. */
  confirmEvent(eventId: string): Promise<void>;

  /** Best-effort removal; used when a booking is declined, expires or half-fails. */
  cancelEvent(eventId: string): Promise<void>;
}

/** Persists bookings so the site keeps its own record independent of the calendar. */
export interface BookingRepositoryPort {
  readonly name: string;
  readonly isDurable: boolean;

  save(booking: Booking): Promise<void>;
  findByReference(reference: string): Promise<Booking | null>;
  /** Active bookings overlapping the window — the double-book guard. */
  findActiveWithin(from: DateTime, to: DateTime): Promise<Booking[]>;
  countActiveOnDay(day: DateTime, timezone: string): Promise<number>;
  /** Pending requests whose hold has run out, so they can be released. */
  findLapsed(now: DateTime): Promise<Booking[]>;
  markCancelled(reference: string): Promise<void>;
}

/**
 * Sends the human notifications around a booking.
 *
 * One method per thing that actually happened, rather than a single generic
 * `notify`. The wording differs enough between "someone asked", "he said yes"
 * and "nobody answered in time" that collapsing them loses the point.
 */
export interface NotifierPort {
  readonly name: string;
  /** To Richie: a request needs an answer. To the attendee: it is held. */
  bookingRequested(booking: Booking, manageUrl: string): Promise<void>;
  bookingConfirmed(booking: Booking): Promise<void>;
  bookingDeclined(booking: Booking): Promise<void>;
  bookingExpired(booking: Booking): Promise<void>;
}

/** Injectable clock so time-dependent rules are testable. */
export interface ClockPort {
  now(): DateTime;
}
