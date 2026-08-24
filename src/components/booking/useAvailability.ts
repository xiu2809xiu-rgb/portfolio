'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiError, DayResponse, MonthResponse } from './types';

/**
 * Turns a failed response into something a visitor can act on.
 *
 * Never surfaces the upstream text verbatim — Google returns strings like
 * "invalid_grant", which mean nothing to a visitor and leak how the integration
 * is wired. The owner still gets the real reason from the server logs and
 * /api/health.
 */
async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiError;
    if (body.error === 'calendar_unavailable') {
      return "I can't reach my calendar right now, so I can't show what's free. Try again in a minute, or just email me.";
    }
    if (body.error === 'rate_limited') return body.message;
  } catch {
    /* fall through to the generic message */
  }
  return 'Could not load availability. Please try again.';
}

interface AvailabilityState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches availability for a month and a day, keeping both in sync with the
 * selected duration.
 *
 * Every request carries an AbortController: changing the duration while a month
 * is still loading is common (people click 15/30/45/60 in quick succession), and
 * without cancellation a slow earlier response can land last and overwrite the
 * correct one.
 */
export function useAvailability(duration: number) {
  const [month, setMonth] = useState<AvailabilityState<MonthResponse>>({
    data: null,
    loading: true,
    error: null,
  });
  const [day, setDay] = useState<AvailabilityState<DayResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const monthAbort = useRef<AbortController | null>(null);
  const dayAbort = useRef<AbortController | null>(null);

  const loadMonth = useCallback(
    async (monthISO: string) => {
      monthAbort.current?.abort();
      const controller = new AbortController();
      monthAbort.current = controller;

      setMonth((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(
          `/api/availability?month=${monthISO}&duration=${duration}`,
          { signal: controller.signal, cache: 'no-store' },
        );
        if (!response.ok) {
          setMonth({ data: null, loading: false, error: await readError(response) });
          return;
        }
        setMonth({ data: (await response.json()) as MonthResponse, loading: false, error: null });
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setMonth({
          data: null,
          loading: false,
          error: 'Could not reach the server. Check your connection and try again.',
        });
      }
    },
    [duration],
  );

  const loadDay = useCallback(
    async (dateISO: string) => {
      dayAbort.current?.abort();
      const controller = new AbortController();
      dayAbort.current = controller;

      setDay((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`/api/availability?date=${dateISO}&duration=${duration}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) {
          setDay({ data: null, loading: false, error: await readError(response) });
          return;
        }
        setDay({ data: (await response.json()) as DayResponse, loading: false, error: null });
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setDay({
          data: null,
          loading: false,
          error: 'Could not reach the server. Check your connection and try again.',
        });
      }
    },
    [duration],
  );

  useEffect(
    () => () => {
      monthAbort.current?.abort();
      dayAbort.current?.abort();
    },
    [],
  );

  return { month, day, loadMonth, loadDay };
}
