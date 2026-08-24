import { BookingValidationError } from './errors';

/** The only session lengths that can be booked. */
export const ALLOWED_DURATIONS = [15, 30, 45, 60] as const;

export type DurationMinutes = (typeof ALLOWED_DURATIONS)[number];

/**
 * A session length, in minutes.
 *
 * Value object: immutable, compared by value, and impossible to construct in an
 * invalid state. Anything outside {@link ALLOWED_DURATIONS} is rejected at the
 * boundary rather than fanning out into the scheduling maths.
 */
export class Duration {
  private constructor(readonly minutes: DurationMinutes) {
    Object.freeze(this);
  }

  static of(minutes: number): Duration {
    if (!Duration.isAllowed(minutes)) {
      throw new BookingValidationError(
        `Unsupported session length: ${minutes} minutes. Choose one of ${ALLOWED_DURATIONS.join(', ')}.`,
      );
    }
    return new Duration(minutes);
  }

  /** Parses a value that arrived over the wire; returns the default on anything unusable. */
  static parse(value: unknown, fallback: DurationMinutes = 30): Duration {
    const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value;
    return Duration.isAllowed(parsed) ? new Duration(parsed) : Duration.of(fallback);
  }

  static isAllowed(value: unknown): value is DurationMinutes {
    return typeof value === 'number' && (ALLOWED_DURATIONS as readonly number[]).includes(value);
  }

  static all(): readonly Duration[] {
    return ALLOWED_DURATIONS.map((minutes) => new Duration(minutes));
  }

  get milliseconds(): number {
    return this.minutes * 60_000;
  }

  /** "30 min" / "1 hour" — used for labels and calendar event titles. */
  get label(): string {
    return this.minutes === 60 ? '1 hour' : `${this.minutes} min`;
  }

  equals(other: Duration): boolean {
    return this.minutes === other.minutes;
  }

  toString(): string {
    return String(this.minutes);
  }

  toJSON(): DurationMinutes {
    return this.minutes;
  }
}
