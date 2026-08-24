import { randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';
import { SchedulingPolicy } from '../config/SchedulingPolicy';
import { Attendee, type AttendeeInput } from '../domain/Attendee';
import { Booking } from '../domain/Booking';
import { Duration } from '../domain/Duration';
import {
  BookingNotFoundError,
  BookingValidationError,
  SlotAlreadyBookedError,
  SlotUnavailableError,
} from '../domain/errors';
import { TimeSlot } from '../domain/TimeSlot';
import type { BookingRepositoryPort, CalendarPort, ClockPort, NotifierPort } from '../ports';
import type { AvailabilityService } from './AvailabilityService';

export interface CreateBookingCommand {
  startISO: string;
  durationMinutes: number;
  attendee: AttendeeInput;
}

/** Reference codes people can quote back — unambiguous characters only. */
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Use case: turn a slot pick plus contact details into a confirmed session.
 *
 * The ordering matters. Availability is re-verified *server-side* at submit time,
 * the booking row is written before the calendar call, and a failed calendar write
 * rolls the row back — so the site never shows a confirmation for a session that
 * does not exist on the calendar, and never silently drops one that does.
 */
export class BookingService {
  constructor(
    private readonly policy: SchedulingPolicy,
    private readonly availability: AvailabilityService,
    private readonly calendar: CalendarPort,
    private readonly repository: BookingRepositoryPort,
    private readonly notifier: NotifierPort,
    private readonly clock: ClockPort,
  ) {}

  async create(command: CreateBookingCommand): Promise<Booking> {
    const duration = Duration.of(command.durationMinutes);

    const start = DateTime.fromISO(command.startISO, { setZone: true });
    if (!start.isValid) {
      throw new BookingValidationError('Start time must be a valid ISO 8601 timestamp.');
    }

    // The end is derived from the trusted duration, never read off the request —
    // otherwise a caller could book a 15-minute slot that occupies three hours.
    const slot = TimeSlot.fromStart(start, duration);
    const attendee = Attendee.create(command.attendee);

    if (!this.availability.isOnGrid(slot)) {
      throw new SlotUnavailableError(
        'That start time is not one of the offered slots. Refresh the calendar and pick again.',
      );
    }

    if (!this.policy.isWithinHorizon(slot, this.clock.now())) {
      throw new SlotUnavailableError(
        `Sessions need at least ${this.policy.minimumNoticeMinutes} minutes of notice and can be booked up to ${this.policy.bookingHorizonDays} days ahead.`,
      );
    }

    const { ok, state } = await this.availability.isBookable(slot);
    if (!ok) {
      if (state === 'busy') throw new SlotAlreadyBookedError();
      throw new SlotUnavailableError('That slot is no longer available. Please choose another.');
    }

    const booking = Booking.schedule({
      id: randomUUID(),
      reference: BookingService.generateReference(),
      slot,
      attendee,
      createdAt: this.clock.now(),
    });

    // Claim the slot first so a concurrent request loses the race here, not on
    // the calendar — two Google events for the same slot would be far worse.
    await this.repository.save(booking);

    try {
      const { eventId, meetingUrl } = await this.calendar.createEvent(booking);
      booking.attachCalendarEvent(eventId, meetingUrl);
      await this.repository.save(booking);
    } catch (error) {
      await this.repository.markCancelled(booking.reference).catch(() => undefined);
      throw error;
    }

    // A failed email must not fail the booking — the session is already real.
    await this.notifier.bookingConfirmed(booking).catch(() => undefined);

    return booking;
  }

  async findByReference(reference: string): Promise<Booking> {
    const booking = await this.repository.findByReference(reference.trim().toUpperCase());
    if (!booking) {
      throw new BookingNotFoundError(`No booking found for reference ${reference}.`);
    }
    return booking;
  }

  async cancel(reference: string): Promise<Booking> {
    const booking = await this.findByReference(reference);
    if (booking.calendarEventId) {
      await this.calendar.cancelEvent(booking.calendarEventId).catch(() => undefined);
    }
    booking.cancel();
    await this.repository.markCancelled(booking.reference);
    return booking;
  }

  /** e.g. "RK-7QX4N2" */
  private static generateReference(): string {
    let code = '';
    for (let i = 0; i < 6; i += 1) {
      code += REFERENCE_ALPHABET[Math.floor(Math.random() * REFERENCE_ALPHABET.length)];
    }
    return `RK-${code}`;
  }
}
