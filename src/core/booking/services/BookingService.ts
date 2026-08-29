import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
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
    /** Absolute site origin, used to build the approve/decline link. */
    private readonly siteUrl: string,
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

    /*
      The per-day cap is enforced here rather than inside isBookable so the
      refusal can say why. Without this the cap was decoration: the grid greyed
      out a full day, but anyone POSTing straight to /api/bookings — or anyone
      whose page was rendered before the day filled up — could keep adding to it.
    */
    const bookedThatDay = await this.repository.countActiveOnDay(
      slot.start.setZone(this.policy.timezone),
      this.policy.timezone,
    );
    if (bookedThatDay >= this.policy.maxPerDay) {
      throw new SlotUnavailableError(
        `That day already has ${this.policy.maxPerDay} sessions booked. Please pick another date.`,
      );
    }

    const { ok, state } = await this.availability.isBookable(slot);
    if (!ok) {
      if (state === 'busy') throw new SlotAlreadyBookedError();
      throw new SlotUnavailableError('That slot is no longer available. Please choose another.');
    }

    const now = this.clock.now();
    const booking = Booking.request({
      id: randomUUID(),
      reference: BookingService.generateReference(),
      slot,
      attendee,
      actionToken: randomBytes(24).toString('base64url'),
      holdExpiresAt: this.policy.holdExpiresFrom(now),
      createdAt: now,
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

    // A failed email must not fail the request — the hold is already real.
    await this.notifier
      .bookingRequested(booking, this.manageUrl(booking))
      .catch(() => undefined);

    return booking;
  }

  /** Where Richie answers a request. Carries the token, so it is not guessable. */
  private manageUrl(booking: Booking): string {
    const base = this.siteUrl.replace(/\/$/, '');
    return `${base}/book/requests/${booking.reference}?token=${booking.actionToken}`;
  }

  /**
   * Turns a held request into an agreed meeting.
   *
   * The token is compared in constant time. It is a bearer credential sitting in
   * an inbox, and a timing oracle on a six-character reference plus a token is a
   * cheap thing to remove.
   */
  async approve(reference: string, token: string): Promise<Booking> {
    const booking = await this.requirePendingRequest(reference, token);

    if (booking.calendarEventId) {
      await this.calendar.confirmEvent(booking.calendarEventId);
    }
    booking.approve();
    await this.repository.save(booking);
    await this.notifier.bookingConfirmed(booking).catch(() => undefined);
    return booking;
  }

  async decline(reference: string, token: string): Promise<Booking> {
    const booking = await this.requirePendingRequest(reference, token);

    if (booking.calendarEventId) {
      await this.calendar.cancelEvent(booking.calendarEventId).catch(() => undefined);
    }
    booking.decline();
    await this.repository.save(booking);
    await this.notifier.bookingDeclined(booking).catch(() => undefined);
    return booking;
  }

  /**
   * Releases requests nobody answered in time.
   *
   * Run lazily from the availability read rather than on a schedule: a lapsed
   * hold only matters at the moment someone looks at the calendar, and a
   * serverless deployment has nowhere reliable to run a timer. The sweep is a
   * no-op — one indexed query — whenever there is nothing to release.
   */
  async releaseLapsed(): Promise<number> {
    const lapsed = await this.repository.findLapsed(this.clock.now());

    for (const booking of lapsed) {
      if (booking.calendarEventId) {
        await this.calendar.cancelEvent(booking.calendarEventId).catch(() => undefined);
      }
      booking.expire();
      await this.repository.save(booking);
      await this.notifier.bookingExpired(booking).catch(() => undefined);
    }

    return lapsed.length;
  }

  /** Shared by approve and decline: same lookup, same refusals, same order. */
  private async requirePendingRequest(reference: string, token: string): Promise<Booking> {
    const booking = await this.findByReference(reference);

    if (!BookingService.tokensMatch(booking.actionToken, token)) {
      throw new BookingNotFoundError(`No booking found for reference ${reference}.`);
    }

    if (!booking.isPending) {
      throw new BookingValidationError(`This request has already been ${booking.status}.`);
    }

    if (booking.hasLapsed(this.clock.now())) {
      throw new SlotUnavailableError(
        'This request was held for its full window and has expired. The slot is free again.',
      );
    }

    return booking;
  }

  private static tokensMatch(expected: string, provided: string): boolean {
    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    return a.length === b.length && timingSafeEqual(a, b);
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
