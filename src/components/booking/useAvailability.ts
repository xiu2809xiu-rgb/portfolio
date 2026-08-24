'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DayResponse, MonthResponse } from './types';

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
        if (!response.ok) throw new Error(`Availability request failed (${response.status})`);
        setMonth({ data: (await response.json()) as MonthResponse, loading: false, error: null });
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setMonth({ data: null, loading: false, error: 'Could not load the calendar.' });
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
        if (!response.ok) throw new Error(`Availability request failed (${response.status})`);
        setDay({ data: (await response.json()) as DayResponse, loading: false, error: null });
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setDay({ data: null, loading: false, error: 'Could not load times for that day.' });
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
