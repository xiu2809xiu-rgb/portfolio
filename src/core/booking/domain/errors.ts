/**
 * Domain errors.
 *
 * Every error carries an HTTP status and a stable machine-readable `code`, so the
 * API layer can translate a thrown domain error into a response without knowing
 * anything about the domain rules that produced it.
 */
export abstract class BookingError extends Error {
  abstract readonly code: string;
  abstract readonly status: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }

  toJSON() {
    return { error: this.code, message: this.message };
  }
}

/** Input failed validation — bad duration, malformed email, unparseable date. */
export class BookingValidationError extends BookingError {
  readonly code = 'invalid_request';
  readonly status = 400;
}

/** The requested slot is outside working hours, too soon, or too far ahead. */
export class SlotUnavailableError extends BookingError {
  readonly code = 'slot_unavailable';
  readonly status = 409;
}

/** Someone booked the slot between the availability check and the submit. */
export class SlotAlreadyBookedError extends BookingError {
  readonly code = 'slot_already_booked';
  readonly status = 409;

  constructor(message = 'That time was just taken. Pick another slot and try again.') {
    super(message);
  }
}

/** No booking exists for the supplied reference. */
export class BookingNotFoundError extends BookingError {
  readonly code = 'not_found';
  readonly status = 404;
}

/** A downstream dependency (Google Calendar, the database) failed. */
export class CalendarUnavailableError extends BookingError {
  readonly code = 'calendar_unavailable';
  readonly status = 503;
}

export const isBookingError = (error: unknown): error is BookingError =>
  error instanceof BookingError;
