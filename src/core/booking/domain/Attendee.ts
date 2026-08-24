import { BookingValidationError } from './errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_NAME = 80;
const MAX_NOTE = 800;
const MAX_TOPIC = 120;

export interface AttendeeInput {
  name: string;
  email: string;
  topic?: string | null;
  note?: string | null;
  timezone?: string | null;
}

/**
 * The person requesting the session.
 *
 * Trims and length-caps every field at construction, so nothing downstream —
 * the database, the calendar event body, the confirmation email — has to
 * re-sanitise or worry about a 10 MB "note".
 */
export class Attendee {
  private constructor(
    readonly name: string,
    readonly email: string,
    readonly topic: string | null,
    readonly note: string | null,
    readonly timezone: string,
  ) {
    Object.freeze(this);
  }

  static create(input: AttendeeInput): Attendee {
    const name = (input.name ?? '').trim();
    const email = (input.email ?? '').trim().toLowerCase();

    if (name.length < 2) {
      throw new BookingValidationError('Please give a name of at least 2 characters.');
    }
    if (name.length > MAX_NAME) {
      throw new BookingValidationError(`Name must be ${MAX_NAME} characters or fewer.`);
    }
    if (!EMAIL_PATTERN.test(email)) {
      throw new BookingValidationError('Please give a valid email address so the invite can reach you.');
    }

    const topic = Attendee.clamp(input.topic, MAX_TOPIC);
    const note = Attendee.clamp(input.note, MAX_NOTE);
    const timezone = (input.timezone ?? '').trim() || 'Asia/Singapore';

    return new Attendee(name, email, topic, note, timezone);
  }

  private static clamp(value: string | null | undefined, max: number): string | null {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return null;
    return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
  }

  get firstName(): string {
    return this.name.split(/\s+/)[0] ?? this.name;
  }

  toJSON() {
    return {
      name: this.name,
      email: this.email,
      topic: this.topic,
      note: this.note,
      timezone: this.timezone,
    };
  }
}
