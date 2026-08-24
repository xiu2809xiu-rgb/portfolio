'use client';

import { DateTime } from 'luxon';
import { cn } from '@/lib/utils';
import type { AvailabilitySlot, DayResponse, SlotState } from './types';
import { SLOT_LEGEND } from './types';

interface SlotPickerProps {
  day: DayResponse | null;
  loading: boolean;
  error: string | null;
  selectedStart: string | null;
  viewerTimezone: string;
  onSelect: (slot: AvailabilitySlot) => void;
}

/** Reason shown on hover/focus for a slot that cannot be taken. */
const STATE_HINT: Record<SlotState, string> = {
  free: '',
  busy: 'Already booked',
  past: 'This time has passed',
  notice: 'Inside the minimum-notice window',
};

export function SlotPicker({
  day,
  loading,
  error,
  selectedStart,
  viewerTimezone,
  onSelect,
}: SlotPickerProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-xl border border-hairline bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground">
        {error}
      </p>
    );
  }

  if (!day) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Pick a date to see what is open.
      </p>
    );
  }

  if (day.slots.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nothing on this day — I keep weekends clear. Try a weekday.
      </p>
    );
  }

  const viewerDiffers = viewerTimezone !== day.config.timezone;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-heading text-base font-bold">
          {DateTime.fromISO(day.date, { zone: day.config.timezone }).toFormat('cccc, d LLLL')}
          <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
            {day.freeCount} free
          </span>
        </h3>
      </div>

      {/* Legend. Present before the grid so it is read first by assistive tech. */}
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5">
        {SLOT_LEGEND.map((entry) => (
          <li key={entry.state} className="flex items-center gap-1.5" title={entry.description}>
            <span
              className={cn(
                'size-2 rounded-full',
                entry.state === 'free' && 'bg-lime',
                entry.state === 'busy' && 'bg-warning',
                entry.state === 'notice' && 'bg-aqua/60',
                entry.state === 'past' && 'bg-muted-foreground/40',
              )}
              aria-hidden
            />
            <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              {entry.label}
            </span>
          </li>
        ))}
      </ul>

      <div
        className="grid max-h-[26rem] grid-cols-2 gap-2 overflow-y-auto pr-1"
        role="listbox"
        aria-label="Available times"
      >
        {day.slots.map((slot) => {
          const disabled = slot.state !== 'free';
          const selected = selectedStart === slot.start;
          const viewerLabel = DateTime.fromISO(slot.start)
            .setZone(viewerTimezone)
            .setLocale('en-US')
            .toFormat('h:mm a');

          return (
            <button
              key={slot.start}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={disabled}
              title={disabled ? STATE_HINT[slot.state] : undefined}
              onClick={() => onSelect(slot)}
              className={cn(
                'group relative rounded-xl border px-3 py-3 text-center font-mono text-sm transition-all',
                disabled
                  ? 'cursor-not-allowed border-hairline/60 text-muted-foreground/45 line-through decoration-1'
                  : 'cursor-pointer border-hairline hover:-translate-y-0.5 hover:border-lime/50 hover:bg-lime/[0.07]',
                selected && 'border-lime bg-lime/15 text-lime',
              )}
            >
              {slot.label}

              {/* State pip, mirroring the legend. */}
              <span
                className={cn(
                  'absolute right-2 top-2 size-1.5 rounded-full',
                  slot.state === 'free' && 'bg-lime',
                  slot.state === 'busy' && 'bg-warning',
                  slot.state === 'notice' && 'bg-aqua/60',
                  slot.state === 'past' && 'bg-muted-foreground/40',
                )}
                aria-hidden
              />

              {viewerDiffers ? (
                <span className="mt-0.5 block text-[0.6rem] text-muted-foreground">
                  {viewerLabel} your time
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {viewerDiffers ? (
        <p className="mt-3 font-mono text-[0.65rem] text-muted-foreground">
          Times shown in {day.config.timezone.replace('_', ' ')} · your zone is{' '}
          {viewerTimezone.replace('_', ' ')}
        </p>
      ) : null}
    </div>
  );
}
