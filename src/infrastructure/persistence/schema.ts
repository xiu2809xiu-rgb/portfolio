import { sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

/**
 * Bookings table.
 *
 * Times are `timestamptz` so Postgres stores true instants — the same discipline
 * the domain keeps — and the partial-ish index on (`starts_at`, `ends_at`) keeps
 * the overlap query cheap as the table grows.
 */
export const bookings = pgTable(
  'bookings',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    reference: varchar('reference', { length: 16 }).notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    durationMinutes: varchar('duration_minutes', { length: 4 }).notNull(),
    status: varchar('status', { length: 16 }).notNull().default('confirmed'),
    attendeeName: varchar('attendee_name', { length: 120 }).notNull(),
    attendeeEmail: varchar('attendee_email', { length: 254 }).notNull(),
    attendeeTimezone: varchar('attendee_timezone', { length: 64 }).notNull(),
    topic: varchar('topic', { length: 160 }),
    note: text('note'),
    calendarEventId: varchar('calendar_event_id', { length: 256 }),
    meetingUrl: text('meeting_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /* Bearer token behind the approve/decline links. Never leaves Richie's inbox. */
    actionToken: varchar('action_token', { length: 64 }).notNull().default(''),
    /* When an unanswered request stops holding its slot. */
    holdExpiresAt: timestamp('hold_expires_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('bookings_reference_idx').on(table.reference),
    index('bookings_window_idx').on(table.startsAt, table.endsAt),
    index('bookings_status_idx').on(table.status),
    /*
      The one guarantee application code cannot give itself. Availability is
      read, then the row is written, and between those two awaits a second
      request can pass the same check — so two people get told they have the
      slot. A partial unique index moves the decision into Postgres, where the
      race is decided once. Partial, because a cancelled booking must free its
      slot for someone else.
    */
    uniqueIndex('bookings_live_slot_idx')
      .on(table.startsAt)
      .where(sql`${table.status} in ('pending', 'confirmed')`),
  ],
);

export type BookingRow = typeof bookings.$inferSelect;
export type NewBookingRow = typeof bookings.$inferInsert;
