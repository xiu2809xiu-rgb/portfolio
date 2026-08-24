'use client';

import { CalendarX, Mail, RotateCw } from 'lucide-react';
import { profile } from '@/content/profile';

interface AvailabilityUnavailableProps {
  message: string;
  onRetry: () => void;
}

/**
 * Shown when availability cannot be read at all.
 *
 * Deliberately offers a way through rather than just reporting a failure: the
 * visitor came here to reach Richie, and an email link still does that. Retrying
 * is offered too, since the common causes (a transient Google outage, an expired
 * token being refreshed) resolve on their own.
 */
export function AvailabilityUnavailable({ message, onRetry }: AvailabilityUnavailableProps) {
  return (
    <div className="flex flex-col items-center px-4 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-full border border-warning/30 bg-warning/10">
        <CalendarX className="size-6 text-warning" />
      </div>

      <h3 className="mt-5 font-heading text-lg font-bold tracking-tight">
        Calendar unavailable
      </h3>

      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{message}</p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors hover:border-lime/40 hover:bg-lime/5"
        >
          <RotateCw className="size-3.5" />
          Try again
        </button>

        <a
          href={`mailto:${profile.email}?subject=${encodeURIComponent('Booking a session')}`}
          className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-black transition-transform hover:scale-[1.03]"
        >
          <Mail className="size-3.5" />
          Email me instead
        </a>
      </div>
    </div>
  );
}
