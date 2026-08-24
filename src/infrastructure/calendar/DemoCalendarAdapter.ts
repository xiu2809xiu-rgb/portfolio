import { DateTime } from 'luxon';
import type { Booking } from '@/core/booking/domain/Booking';
import { TimeSlot } from '@/core/booking/domain/TimeSlot';
import type { CalendarPort } from '@/core/booking/ports';

/**
 * Stand-in calendar used until Google credentials are configured.
 *
 * It exists so the booking flow is fully explorable — including the busy legend —
 * on a fresh clone or a preview deploy with no secrets. Busy blocks are derived
 * from a hash of the date, so they are *stable*: the same day always shows the
 * same pattern across requests instead of flickering on every render.
 *
 * `isLive` is false, which the UI reads to show a "demo availability" notice, and
 * `createEvent` deliberately does not pretend to send anything.
 */
export class DemoCalendarAdapter implements CalendarPort {
  readonly name = 'demo-calendar';
  readonly isLive = false;

  constructor(private readonly timezone = 'Asia/Singapore') {}

  async busyIntervals(from: DateTime, to: DateTime): Promise<TimeSlot[]> {
    const busy: TimeSlot[] = [];
    const start = from.setZone(this.timezone).startOf('day');
    const end = to.setZone(this.timezone).endOf('day');

    for (let day = start; day <= end; day = day.plus({ days: 1 })) {
      if (day.weekday > 5) continue;

      const seed = DemoCalendarAdapter.hash(day.toISODate() ?? '');

      // Two or three meeting-shaped blocks per weekday.
      const blockCount = 2 + (seed % 2);
      for (let index = 0; index < blockCount; index += 1) {
        const slotSeed = DemoCalendarAdapter.hash(`${day.toISODate()}:${index}`);
        const hour = 9 + (slotSeed % 9); // 09:00 – 17:00
        const minute = slotSeed % 2 === 0 ? 0 : 30;
        const length = [30, 60, 90][slotSeed % 3];

        const blockStart = day.set({ hour, minute, second: 0, millisecond: 0 });
        busy.push(TimeSlot.fromISO(blockStart.toISO()!, blockStart.plus({ minutes: length }).toISO()!));
      }
    }

    return busy;
  }

  async createEvent(booking: Booking): Promise<{ eventId: string; meetingUrl: string | null }> {
    return { eventId: `demo-${booking.reference}`, meetingUrl: null };
  }

  async cancelEvent(): Promise<void> {
    // Nothing to cancel — no event was ever created upstream.
  }

  /** FNV-1a: small, fast, and stable across Node versions. */
  private static hash(value: string): number {
    let hash = 0x811c9dc5;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return Math.abs(hash);
  }
}
