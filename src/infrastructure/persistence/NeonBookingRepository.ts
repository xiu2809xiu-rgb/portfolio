import { neon } from '@neondatabase/serverless';
import { and, eq, gte, lt, lte, sql } from 'drizzle-orm';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { DateTime } from 'luxon';
import { Booking, type BookingSnapshot } from '@/core/booking/domain/Booking';
import type { BookingRepositoryPort } from '@/core/booking/ports';
import { bookings, type BookingRow } from './schema';

/**
 * Durable booking store on Neon Postgres over HTTP.
 *
 * The HTTP driver (rather than a pooled TCP connection) is what makes this safe
 * in Vercel's serverless runtime, where a function can be frozen mid-request and
 * a held socket would be lost.
 */
export class NeonBookingRepository implements BookingRepositoryPort {
  readonly name = 'neon-postgres';
  readonly isDurable = true;

  private readonly db: NeonHttpDatabase;

  constructor(connectionString: string) {
    this.db = drizzle(neon(connectionString));
  }

  /** Returns null when no database URL is set, so the container can fall back. */
  static fromEnv(env: NodeJS.ProcessEnv = process.env): NeonBookingRepository | null {
    const url = env.DATABASE_URL || env.POSTGRES_URL;
    return url ? new NeonBookingRepository(url) : null;
  }

  async save(booking: Booking): Promise<void> {
    const snapshot = booking.toSnapshot();
    const row = {
      id: snapshot.id,
      reference: snapshot.reference,
      startsAt: new Date(snapshot.startsAt),
      endsAt: new Date(snapshot.endsAt),
      durationMinutes: String(snapshot.durationMinutes),
      status: snapshot.status,
      attendeeName: snapshot.attendeeName,
      attendeeEmail: snapshot.attendeeEmail,
      attendeeTimezone: snapshot.attendeeTimezone,
      topic: snapshot.topic,
      note: snapshot.note,
      calendarEventId: snapshot.calendarEventId,
      meetingUrl: snapshot.meetingUrl,
      createdAt: new Date(snapshot.createdAt),
    };

    // Upsert so `save` can be called twice for one booking — once to claim the
    // slot, once to attach the calendar event id.
    await this.db
      .insert(bookings)
      .values(row)
      .onConflictDoUpdate({
        target: bookings.id,
        set: {
          status: row.status,
          calendarEventId: row.calendarEventId,
          meetingUrl: row.meetingUrl,
        },
      });
  }

  async findByReference(reference: string): Promise<Booking | null> {
    const rows = await this.db
      .select()
      .from(bookings)
      .where(eq(bookings.reference, reference))
      .limit(1);

    return rows[0] ? Booking.fromSnapshot(NeonBookingRepository.toSnapshot(rows[0])) : null;
  }

  async findActiveWithin(from: DateTime, to: DateTime): Promise<Booking[]> {
    // Half-open overlap: starts before the window ends AND ends after it starts.
    const rows = await this.db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'confirmed'),
          lt(bookings.startsAt, to.toJSDate()),
          sql`${bookings.endsAt} > ${from.toJSDate()}`,
        ),
      );

    return rows.map((row) => Booking.fromSnapshot(NeonBookingRepository.toSnapshot(row)));
  }

  async countActiveOnDay(day: DateTime, timezone: string): Promise<number> {
    const start = day.setZone(timezone).startOf('day');
    const end = start.plus({ days: 1 });

    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'confirmed'),
          gte(bookings.startsAt, start.toJSDate()),
          lte(bookings.startsAt, end.toJSDate()),
        ),
      );

    return rows[0]?.count ?? 0;
  }

  async markCancelled(reference: string): Promise<void> {
    await this.db
      .update(bookings)
      .set({ status: 'cancelled' })
      .where(eq(bookings.reference, reference));
  }

  private static toSnapshot(row: BookingRow): BookingSnapshot {
    return {
      id: row.id,
      reference: row.reference,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      durationMinutes: Number.parseInt(row.durationMinutes, 10),
      status: row.status === 'cancelled' ? 'cancelled' : 'confirmed',
      attendeeName: row.attendeeName,
      attendeeEmail: row.attendeeEmail,
      topic: row.topic,
      note: row.note,
      attendeeTimezone: row.attendeeTimezone,
      calendarEventId: row.calendarEventId,
      meetingUrl: row.meetingUrl,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
