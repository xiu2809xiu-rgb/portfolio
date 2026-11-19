'use client';

import { DateTime } from 'luxon';
import { bookingDict } from '@/i18n/dictionaries/booking';
import { useT } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';
import type { AvailabilitySlot, DayResponse } from './types';
import { SLOT_LEGEND } from './types';

interface SlotPickerProps {
  day: DayResponse | null;
  loading: boolean;
  error: string | null;
  selectedStart: string | null;
  viewerTimezone: string;
  onSelect: (slot: AvailabilitySlot) => void;
}

export function SlotPicker({
  day,
  loading,
  error,
  selectedStart,
  viewerTimezone,
  onSelect,
}: SlotPickerProps) {
  const { slots: t, format } = useT(bookingDict);

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
      <p className="py-10 text-center text-sm text-muted-foreground">{t.pickDate}</p>
    );
  }

  if (day.slots.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">{t.emptyDay}</p>
    );
  }

  const viewerDiffers = viewerTimezone !== day.config.timezone;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-heading text-base font-bold">
          {format.dayHeading(DateTime.fromISO(day.date, { zone: day.config.timezone }))}
          <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
            {t.freeCount(day.freeCount)}
          </span>
        </h3>
      </div>

      {/* Legend. Present before the grid so it is read first by assistive tech. */}
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5">
        {SLOT_LEGEND.map((state) => (
          <li key={state} className="flex items-center gap-1.5" title={t.legend[state].description}>
            <span
              className={cn(
                'size-2 rounded-full',
                state === 'free' && 'bg-lime',
                state === 'busy' && 'bg-warning',
                state === 'notice' && 'bg-aqua/60',
                state === 'past' && 'bg-muted-foreground/40',
              )}
              aria-hidden
            />
            <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              {t.legend[state].label}
            </span>
          </li>
        ))}
      </ul>

      <div
        className="grid max-h-[26rem] grid-cols-2 gap-2 overflow-y-auto pr-1"
        role="listbox"
        aria-label={t.list}
      >
        {day.slots.map((slot) => {
          const disabled = slot.state !== 'free';
          const selected = selectedStart === slot.start;
          const start = DateTime.fromISO(slot.start);
          /*
            The owner's time is formatted here rather than read from `slot.label`,
            which the server writes in English. For English this is the very call
            that produced the label — en-US `h:mm a` in the policy's zone.
          */
          const ownerLabel = format.time(start.setZone(day.config.timezone));
          const viewerLabel = format.time(start.setZone(viewerTimezone));

          return (
            <button
              key={slot.start}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={disabled}
              title={slot.state === 'free' ? undefined : t.unavailableReason[slot.state]}
              onClick={() => onSelect(slot)}
              className={cn(
                'group relative rounded-xl border px-3 py-3 text-center font-mono text-sm transition-all',
                disabled
                  ? 'cursor-not-allowed border-hairline/60 text-muted-foreground/45 line-through decoration-1'
                  : 'cursor-pointer border-hairline hover:-translate-y-0.5 hover:border-lime/50 hover:bg-lime/[0.07]',
                selected && 'border-lime bg-lime/15 text-lime',
              )}
            >
              {ownerLabel}

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
                  {t.yourTime(viewerLabel)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {viewerDiffers ? (
        <p className="mt-3 font-mono text-[0.65rem] text-muted-foreground">
          {t.zoneNote(format.zoneFull(day.config.timezone), format.zoneFull(viewerTimezone))}
        </p>
      ) : null}
    </div>
  );
}
