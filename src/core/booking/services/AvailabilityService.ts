import { DateTime } from 'luxon';
import { SchedulingPolicy } from '../config/SchedulingPolicy';
import { Duration } from '../domain/Duration';
import { BookingValidationError } from '../domain/errors';
import { TimeSlot } from '../domain/TimeSlot';
import type { BookingRepositoryPort, CalendarPort, ClockPort } from '../ports';

/** Why a slot cannot be taken — drives the legend and the tooltip on each button. */
export type SlotState = 'free' | 'busy' | 'past' | 'notice';

export interface AvailabilitySlot {
  readonly start: string;
  readonly end: string;
  readonly state: SlotState;
  readonly label: string;
}

export interface DayAvailability {
  readonly date: string;
  readonly weekday: number;
  readonly isWorkingDay: boolean;
  readonly slots: readonly AvailabilitySlot[];
  readonly freeCount: number;
  readonly atCapacity: boolean;
}

export interface MonthDaySummary {
  readonly date: string;
  readonly isWorkingDay: boolean;
  readonly freeCount: number;
  readonly totalCount: number;
  readonly state: 'open' | 'limited' | 'full' | 'closed' | 'past';
}

/**
 * Turns "which day and how long?" into a list of slots the UI can render.
 *
 * Busy time is the union of two sources: the real calendar (so anything Richie
 * schedules elsewhere blocks the site automatically) and this site's own booking
 * table (so a fresh booking blocks immediately, even before the calendar API is
 * consistent). Merging both is what makes the free/busy legend trustworthy.
 */
export class AvailabilityService {
  constructor(
    private readonly policy: SchedulingPolicy,
    private readonly calendar: CalendarPort,
    private readonly repository: BookingRepositoryPort,
    private readonly clock: ClockPort,
  ) {}

  /** Slots for one calendar day, in the owner's timezone. */
  async forDay(dateISO: string, duration: Duration): Promise<DayAvailability> {
    const day = this.parseDay(dateISO);
    const now = this.clock.now();

    const candidates = this.policy.candidateSlots(day, duration);
    if (candidates.length === 0) {
      return {
        date: day.toISODate()!,
        weekday: day.weekday,
        isWorkingDay: this.policy.isWorkingDay(day),
        slots: [],
        freeCount: 0,
        atCapacity: false,
      };
    }

    const windowStart = candidates[0].start;
    const windowEnd = candidates[candidates.length - 1].end;
    const busy = await this.busyWithin(windowStart, windowEnd);

    const bookedToday = await this.repository.countActiveOnDay(day, this.policy.timezone);
    const atCapacity = bookedToday >= this.policy.maxPerDay;

    const earliest = this.policy.earliestBookableFrom(now);
    const latest = this.policy.latestBookableFrom(now);

    const slots = candidates.map<AvailabilitySlot>((slot) => {
      const state = this.classify(slot, { busy, now, earliest, latest, atCapacity });
      return {
        start: slot.start.toISO()!,
        end: slot.end.toISO()!,
        state,
        label: slot.startLabel(this.policy.timezone),
      };
    });

    return {
      date: day.toISODate()!,
      weekday: day.weekday,
      isWorkingDay: true,
      slots,
      freeCount: slots.filter((slot) => slot.state === 'free').length,
      atCapacity,
    };
  }

  /**
   * One summary row per day of a month, for the calendar grid dots.
   *
   * Fetches busy time for the whole month in a single calendar call rather than
   * 31 of them — the naive per-day version made the month view take seconds.
   */
  async forMonth(monthISO: string, duration: Duration): Promise<readonly MonthDaySummary[]> {
    const anchor = this.parseDay(`${monthISO.slice(0, 7)}-01`);
    const monthStart = anchor.startOf('month');
    const monthEnd = anchor.endOf('month');
    const now = this.clock.now();

    const busy = await this.busyWithin(monthStart, monthEnd);
    const earliest = this.policy.earliestBookableFrom(now);
    const latest = this.policy.latestBookableFrom(now);

    const summaries: MonthDaySummary[] = [];

    for (let day = monthStart; day <= monthEnd; day = day.plus({ days: 1 })) {
      const candidates = this.policy.candidateSlots(day, duration);
      const date = day.toISODate()!;

      if (candidates.length === 0) {
        summaries.push({
          date,
          isWorkingDay: false,
          freeCount: 0,
          totalCount: 0,
          state: day.endOf('day') < now ? 'past' : 'closed',
        });
        continue;
      }

      const freeCount = candidates.filter(
        (slot) => this.classify(slot, { busy, now, earliest, latest, atCapacity: false }) === 'free',
      ).length;

      summaries.push({
        date,
        isWorkingDay: true,
        freeCount,
        totalCount: candidates.length,
        state: this.summariseDay(day, freeCount, candidates.length, now),
      });
    }

    return summaries;
  }

  /** Re-checks a specific slot at submit time. Used by {@link BookingService}. */
  async isBookable(slot: TimeSlot): Promise<{ ok: boolean; state: SlotState }> {
    const now = this.clock.now();
    const busy = await this.busyWithin(slot.start.minus({ hours: 2 }), slot.end.plus({ hours: 2 }));
    const state = this.classify(slot, {
      busy,
      now,
      earliest: this.policy.earliestBookableFrom(now),
      latest: this.policy.latestBookableFrom(now),
      // Capacity is a property of the day, not the slot, and it needs its own
      // message — BookingService.create checks it before calling this.
      atCapacity: false,
    });
    return { ok: state === 'free', state };
  }

  /** Confirms the slot start is one the policy actually offers, not an arbitrary time. */
  isOnGrid(slot: TimeSlot): boolean {
    const duration = Duration.of(slot.durationMinutes);
    return this.policy
      .candidateSlots(slot.start.setZone(this.policy.timezone), duration)
      .some((candidate) => candidate.start.toMillis() === slot.start.toMillis());
  }

  private classify(
    slot: TimeSlot,
    context: {
      busy: readonly TimeSlot[];
      now: DateTime;
      earliest: DateTime;
      latest: DateTime;
      atCapacity: boolean;
    },
  ): SlotState {
    if (slot.start <= context.now) return 'past';

    const padded = slot.padded(this.policy.bufferMinutes);
    if (padded.overlapsAny(context.busy)) return 'busy';

    if (context.atCapacity) return 'busy';
    if (slot.start < context.earliest) return 'notice';
    if (slot.start > context.latest) return 'notice';

    return 'free';
  }

  private summariseDay(
    day: DateTime,
    freeCount: number,
    totalCount: number,
    now: DateTime,
  ): MonthDaySummary['state'] {
    if (day.endOf('day') < now) return 'past';
    if (freeCount === 0) return 'full';
    if (freeCount <= Math.max(1, Math.floor(totalCount * 0.25))) return 'limited';
    return 'open';
  }

  /** Union of calendar busy time and this site's own confirmed bookings. */
  private async busyWithin(from: DateTime, to: DateTime): Promise<TimeSlot[]> {
    const [calendarBusy, ownBookings] = await Promise.all([
      this.calendar.busyIntervals(from, to),
      this.repository.findActiveWithin(from, to),
    ]);
    return [...calendarBusy, ...ownBookings.map((booking) => booking.slot)];
  }

  private parseDay(dateISO: string): DateTime {
    const day = DateTime.fromISO(dateISO, { zone: this.policy.timezone });
    if (!day.isValid) {
      throw new BookingValidationError(`"${dateISO}" is not a valid date. Use YYYY-MM-DD.`);
    }
    return day.startOf('day');
  }
}
