'use client';

import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { bookingDict } from '@/i18n/dictionaries/booking';
import { useT } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';
import type { BookingStep } from './types';

const STEPS: readonly BookingStep[] = ['when', 'details', 'done'];

export function StepIndicator({ current }: { current: BookingStep }) {
  const t = useT(bookingDict).steps;
  const currentIndex = STEPS.indexOf(current);

  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-3" aria-label={t.progress}>
      {STEPS.map((step, index) => {
        const complete = index < currentIndex;
        const active = index === currentIndex;

        return (
          <Fragment key={step}>
            <li
              className="flex items-center gap-2"
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[0.65rem] transition-colors',
                  complete && 'border-lime bg-lime text-black',
                  active && 'border-lime text-lime',
                  !complete && !active && 'border-hairline text-muted-foreground',
                )}
              >
                {complete ? <Check className="size-3" strokeWidth={3} /> : index + 1}
              </span>
              <span
                className={cn(
                  'font-mono text-[0.65rem] uppercase tracking-widest transition-colors sm:text-xs',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {t.names[step]}
              </span>
            </li>

            {index < STEPS.length - 1 ? (
              <li
                aria-hidden
                className={cn(
                  'h-px w-6 transition-colors sm:w-12',
                  index < currentIndex ? 'bg-lime/50' : 'bg-hairline',
                )}
              />
            ) : null}
          </Fragment>
        );
      })}
    </ol>
  );
}
