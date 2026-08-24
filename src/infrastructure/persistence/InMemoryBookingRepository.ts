import { DateTime } from 'luxon';
import type { Booking } from '@/core/booking/domain/Booking';
import type { BookingRepositoryPort } from '@/core/booking/ports';

/**
 * Process-local booking store.
 *
 * Used when no `DATABASE_URL` is configured, and by unit tests. It is explicitly
 * *not* durable — a serverless cold start wipes it — which `isDurable: false`
 * advertises so the health endpoint and the booking UI can warn accordingly.
 */
export class InMemoryBookingRepository implements BookingRepositoryPort {
  readonly name = 'in-memory';
  readonly isDurable = false;

  private readonly byReference = new Map<string, Booking>();

  async save(booking: Booking): Promise<void> {
    this.byReference.set(booking.reference, booking);
  }

  async findByReference(reference: string): Promise<Booking | null> {
    return this.byReference.get(reference) ?? null;
  }

  async findActiveWithin(from: DateTime, to: DateTime): Promise<Booking[]> {
    return [...this.byReference.values()].filter(
      (booking) => booking.isActive && booking.slot.start < to && booking.slot.end > from,
    );
  }

  async countActiveOnDay(day: DateTime, timezone: string): Promise<number> {
    const start = day.setZone(timezone).startOf('day');
    const end = start.plus({ days: 1 });

    return [...this.byReference.values()].filter(
      (booking) => booking.isActive && booking.slot.start >= start && booking.slot.start < end,
    ).length;
  }

  async markCancelled(reference: string): Promise<void> {
    this.byReference.get(reference)?.cancel();
  }
}
