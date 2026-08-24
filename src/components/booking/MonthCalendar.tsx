'use client';

import { useMemo } from 'react';
import { DateTime } from 'luxon';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MonthDaySummary } from './types';

interface MonthCalendarProps {
  /** Anchor month, "YYYY-MM". */
  month: string;
  selected: string | null;
  days: MonthDaySummary[];
  loading: boolean;
  timezone: string;
  onMonthChange: (month: string) => void;
  onSelect: (date: string) => void;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Month grid with an availability dot under each bookable day.
 *
 * The grid is built from Luxon in the *owner's* timezone, not the browser's, so
 * "Tuesday the 15th" means the same day to a visitor in London as it does to
 * Richie in Singapore — otherwise the dots would drift by one column for anyone
 * far enough east or west.
 */
export function MonthCalendar({
  month,
  selected,
  days,
  loading,
  timezone,
  onMonthChange,
  onSelect,
}: MonthCalendarProps) {
  const anchor = DateTime.fromISO(`${month}-01`, { zone: timezone });

  const summaries = useMemo(() => {
    const map = new Map<string, MonthDaySummary>();
    for (const day of days) map.set(day.date, day);
    return map;
  }, [days]);

  const cells = useMemo(() => {
    const start = anchor.startOf('month');
    const end = anchor.endOf('month');
    // Luxon weekday: Mon=1…Sun=7. The grid starts on Sunday.
    const leading = start.weekday % 7;

    const result: (DateTime | null)[] = Array.from({ length: leading }, () => null);
    for (let day = start; day <= end; day = day.plus({ days: 1 })) result.push(day);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [anchor]);

  const today = DateTime.now().setZone(timezone).startOf('day');
  const canGoBack = anchor.startOf('month') > today.startOf('month');

  return (
    /* Capped so the aspect-square day cells stay a sensible size in a wide
       two-column layout instead of stretching into 70px blocks. */
    <div className="mx-auto w-full max-w-sm lg:mx-0">
      <header className="mb-5 flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold tracking-tight">
          {anchor.toFormat('LLLL yyyy')}
        </h3>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={() => onMonthChange(anchor.minus({ months: 1 }).toFormat('yyyy-MM'))}
            className="grid size-8 place-items-center rounded-lg border border-hairline transition-colors hover:border-lime/40 hover:bg-lime/5 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-hairline disabled:hover:bg-transparent"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(anchor.plus({ months: 1 }).toFormat('yyyy-MM'))}
            className="grid size-8 place-items-center rounded-lg border border-hairline transition-colors hover:border-lime/40 hover:bg-lime/5"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Choose a date">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="pb-2 text-center font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground"
            role="columnheader"
          >
            {label}
          </div>
        ))}

        {cells.map((cell, index) => {
          if (!cell) return <div key={`pad-${index}`} aria-hidden />;

          const date = cell.toISODate()!;
          const summary = summaries.get(date);
          const state = summary?.state ?? 'closed';
          const bookable = state === 'open' || state === 'limited';
          const isSelected = selected === date;
          const isToday = cell.hasSame(today, 'day');

          return (
            <button
              key={date}
              type="button"
              role="gridcell"
              disabled={!bookable || loading}
              onClick={() => onSelect(date)}
              aria-selected={isSelected}
              aria-label={`${cell.toFormat('cccc d LLLL')}${
                bookable ? ` — ${summary?.freeCount} slots free` : ' — unavailable'
              }`}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-all',
                'max-h-11',
                bookable
                  ? 'cursor-pointer hover:bg-white/[0.06]'
                  : 'cursor-not-allowed text-muted-foreground/35',
                isSelected && 'bg-lime/15 font-semibold text-lime ring-1 ring-lime/50',
                !isSelected && bookable && 'text-foreground',
                isToday && !isSelected && 'ring-1 ring-white/15',
              )}
            >
              <span className="leading-none">{cell.day}</span>

              {bookable ? (
                <span
                  className={cn(
                    'absolute bottom-1.5 size-1 rounded-full',
                    state === 'open' ? 'bg-lime' : 'bg-warning',
                  )}
                  aria-hidden
                />
              ) : null}

              {state === 'full' ? (
                <span className="absolute bottom-1.5 h-px w-2 rounded-full bg-muted-foreground/50" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="mt-4 text-center font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          Checking calendar…
        </p>
      ) : null}
    </div>
  );
}
