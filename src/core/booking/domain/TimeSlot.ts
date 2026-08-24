import { DateTime, Interval } from 'luxon';
import { Duration } from './Duration';
import { BookingValidationError } from './errors';

/**
 * A half-open interval `[start, end)` on the absolute timeline.
 *
 * Stored as UTC instants. Timezones are a *presentation* concern — the domain
 * only ever compares instants, which is what makes overlap detection correct
 * across DST boundaries and across a visitor in a different zone to Richie.
 */
export class TimeSlot {
  private constructor(
    readonly start: DateTime,
    readonly end: DateTime,
  ) {
    Object.freeze(this);
  }

  static create(start: DateTime, end: DateTime): TimeSlot {
    if (!start.isValid || !end.isValid) {
      throw new BookingValidationError('Slot boundaries are not valid dates.');
    }
    if (end <= start) {
      throw new BookingValidationError('A slot must end after it starts.');
    }
    return new TimeSlot(start.toUTC(), end.toUTC());
  }

  static fromStart(start: DateTime, duration: Duration): TimeSlot {
    return TimeSlot.create(start, start.plus({ minutes: duration.minutes }));
  }

  /** Builds a slot from ISO strings — the shape that arrives from the client. */
  static fromISO(startISO: string, endISO: string): TimeSlot {
    const start = DateTime.fromISO(startISO, { setZone: true });
    const end = DateTime.fromISO(endISO, { setZone: true });
    if (!start.isValid || !end.isValid) {
      throw new BookingValidationError('Slot timestamps must be valid ISO 8601 strings.');
    }
    return TimeSlot.create(start, end);
  }

  get durationMinutes(): number {
    return Math.round(this.end.diff(this.start, 'minutes').minutes);
  }

  get interval(): Interval {
    return Interval.fromDateTimes(this.start, this.end);
  }

  /**
   * True when the two slots share any instant.
   *
   * Half-open on purpose: a 10:00–10:30 booking does not collide with 10:30–11:00,
   * which is what makes back-to-back sessions bookable.
   */
  overlaps(other: TimeSlot): boolean {
    return this.start < other.end && other.start < this.end;
  }

  overlapsAny(others: readonly TimeSlot[]): boolean {
    return others.some((other) => this.overlaps(other));
  }

  contains(instant: DateTime): boolean {
    return instant >= this.start && instant < this.end;
  }

  isBefore(instant: DateTime): boolean {
    return this.end <= instant;
  }

  /** Grows the slot outward by `minutes` on both sides — used for gap buffers. */
  padded(minutes: number): TimeSlot {
    if (minutes <= 0) return this;
    return new TimeSlot(this.start.minus({ minutes }), this.end.plus({ minutes }));
  }

  /**
   * Renders the start time in a viewer's zone, e.g. "9:30 AM".
   *
   * Forced to en-US because en-SG formats the meridiem lowercase ("9:30 am"),
   * which reads as a typo next to the rest of the interface.
   */
  startLabel(timezone: string): string {
    return this.start.setZone(timezone).setLocale('en-US').toFormat('h:mm a');
  }

  toJSON() {
    return { start: this.start.toISO(), end: this.end.toISO() };
  }
}
