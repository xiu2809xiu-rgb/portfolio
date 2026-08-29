'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import { AnimatePresence, motion } from 'motion/react';
import { Clock, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { ALLOWED_DURATIONS } from '@/core/booking/domain/Duration';
import { cn } from '@/lib/utils';
import { AvailabilityUnavailable } from './AvailabilityUnavailable';
import { Confirmation } from './Confirmation';
import { DetailsForm, type BookingDetails } from './DetailsForm';
import { MonthCalendar } from './MonthCalendar';
import { SlotPicker } from './SlotPicker';
import { StepIndicator } from './StepIndicator';
import type {
  ApiError,
  AvailabilitySlot,
  BookingConfirmation,
  BookingStep,
  PolicyConfig,
} from './types';
import { useAvailability } from './useAvailability';

interface BookingFlowProps {
  /** Server-rendered policy so the first paint has real hours, not a guess. */
  initialConfig: PolicyConfig;
  calendarLive: boolean;
}

/**
 * Three-step booking wizard: pick a time, give details, done.
 *
 * Holds the whole flow's state so the individual steps stay presentational. The
 * important behaviour is on failure: a 409 (someone took the slot first) bounces
 * the visitor back to step one *and* refreshes availability, rather than leaving
 * them staring at a form for a slot that no longer exists.
 */
export function BookingFlow({ initialConfig, calendarLive }: BookingFlowProps) {
  const ownerTimezone = initialConfig.timezone;

  const [duration, setDuration] = useState<number>(30);
  const [step, setStep] = useState<BookingStep>('when');
  const [month, setMonth] = useState(() =>
    DateTime.now().setZone(ownerTimezone).toFormat('yyyy-MM'),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [attendeeName, setAttendeeName] = useState('');

  const { month: monthState, day: dayState, loadMonth, loadDay } = useAvailability(duration);

  // Resolved once on the client — the server has no idea where the visitor is.
  const viewerTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || ownerTimezone;
    } catch {
      return ownerTimezone;
    }
  }, [ownerTimezone]);

  useEffect(() => {
    void loadMonth(month);
  }, [month, loadMonth]);

  /**
   * Land on the soonest bookable day rather than an empty right-hand panel.
   *
   * Derived during render instead of assigned from an effect: the answer is a pure
   * function of the month data and the explicit pick, so an effect would only add
   * a wasted render pass and a frame where the panel is blank.
   */
  const effectiveDate = useMemo(() => {
    if (selectedDate) return selectedDate;
    return (
      monthState.data?.days.find((day) => day.state === 'open' || day.state === 'limited')
        ?.date ?? null
    );
  }, [selectedDate, monthState.data]);

  useEffect(() => {
    if (effectiveDate) void loadDay(effectiveDate);
  }, [effectiveDate, loadDay]);

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  }, []);

  /**
   * Changing the duration invalidates the chosen slot — a 60-minute session may not
   * fit where a 15-minute one did — so it is cleared here, in the event that caused
   * it, rather than in an effect watching `duration`.
   */
  const handleSelectDuration = useCallback((minutes: number) => {
    setDuration(minutes);
    setSelectedSlot(null);
  }, []);

  const handleSelectSlot = useCallback((slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    setError(null);
    setStep('details');
  }, []);

  const handleSubmit = useCallback(
    async (details: BookingDetails) => {
      if (!selectedSlot) return;

      setSubmitting(true);
      setError(null);
      setFieldErrors({});

      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start: selectedSlot.start,
            duration,
            name: details.name,
            email: details.email,
            topic: details.topic || null,
            note: details.note || null,
            timezone: viewerTimezone,
            company: details.company,
          }),
        });

        const payload = (await response.json()) as BookingConfirmation | ApiError;

        if (!response.ok) {
          const apiError = payload as ApiError;

          if (apiError.issues?.length) {
            setFieldErrors(
              Object.fromEntries(apiError.issues.map((issue) => [issue.field, issue.message])),
            );
          }

          setError(apiError.message);

          // The slot went while the form was open — send them back to re-pick.
          if (response.status === 409) {
            toast.error(apiError.message);
            setStep('when');
            setSelectedSlot(null);
            if (effectiveDate) void loadDay(effectiveDate);
            void loadMonth(month);
          }
          return;
        }

        setAttendeeName(details.name);
        const confirmed = payload as BookingConfirmation;
        setConfirmation(confirmed);
        setStep('done');
        toast.success('Booking confirmed', {
          description: `Reference ${confirmed.reference} — a calendar invite is on its way.`,
        });
      } catch {
        setError('Could not reach the server. Check your connection and try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [selectedSlot, duration, viewerTimezone, effectiveDate, month, loadDay, loadMonth],
  );

  const reset = useCallback(() => {
    setConfirmation(null);
    setSelectedSlot(null);
    setStep('when');
    setError(null);
    setFieldErrors({});
    void loadMonth(month);
    if (effectiveDate) void loadDay(effectiveDate);
  }, [month, effectiveDate, loadMonth, loadDay]);

  return (
    <div>
      <StepIndicator current={step} />

      <div className="glass mt-8 rounded-3xl p-5 sm:p-7">
        <AnimatePresence mode="wait">
          {step === 'when' ? (
            <motion.div
              key="when"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Session length"
                >
                  {ALLOWED_DURATIONS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => handleSelectDuration(minutes)}
                      aria-pressed={duration === minutes}
                      className={cn(
                        'rounded-xl border px-4 py-2.5 font-mono text-sm transition-all',
                        duration === minutes
                          ? 'border-lime/50 bg-lime/12 text-lime'
                          : 'border-hairline text-muted-foreground hover:border-lime/30 hover:text-foreground',
                      )}
                    >
                      {minutes} min
                    </button>
                  ))}
                </div>

                <p className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                  <Globe className="size-3.5" />
                  {ownerTimezone.split('/')[1]?.replace('_', ' ') ?? ownerTimezone}
                </p>
              </div>

              {/*
                When availability cannot be read, the calendar is replaced rather
                than shown greyed out. A grid of dead dates with no explanation
                looks broken; and guessing what is free would risk handing out a
                slot that is already taken.
              */}
              {monthState.error && !monthState.loading ? (
                <AvailabilityUnavailable
                  message={monthState.error}
                  onRetry={() => void loadMonth(month)}
                />
              ) : (
                <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
                  <MonthCalendar
                    month={month}
                    selected={effectiveDate}
                    days={monthState.data?.days ?? []}
                    loading={monthState.loading}
                    timezone={ownerTimezone}
                    onMonthChange={setMonth}
                    onSelect={handleSelectDate}
                  />

                  <div className="lg:border-l lg:border-hairline lg:pl-10">
                    <SlotPicker
                      day={dayState.data}
                      loading={dayState.loading}
                      error={dayState.error}
                      selectedStart={selectedSlot?.start ?? null}
                      viewerTimezone={viewerTimezone}
                      onSelect={handleSelectSlot}
                    />
                  </div>
                </div>
              )}

              {!calendarLive ? (
                <p className="mt-6 flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/[0.07] p-3 text-xs leading-relaxed text-warning">
                  <Clock className="mt-0.5 size-4 shrink-0" />
                  <span>
                    Showing demo availability. Once Google Calendar is connected this grid
                    reflects my real free/busy — only whether I am free, never what I am doing.
                  </span>
                </p>
              ) : null}
            </motion.div>
          ) : null}

          {step === 'details' && selectedSlot ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <DetailsForm
                slot={selectedSlot}
                durationMinutes={duration}
                ownerTimezone={ownerTimezone}
                viewerTimezone={viewerTimezone}
                submitting={submitting}
                error={error}
                fieldErrors={fieldErrors}
                onBack={() => {
                  setStep('when');
                  setError(null);
                }}
                onSubmit={handleSubmit}
              />
            </motion.div>
          ) : null}

          {step === 'done' && confirmation ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35 }}
              className="py-6"
            >
              <Confirmation
                confirmation={confirmation}
                attendeeName={attendeeName}
                ownerTimezone={ownerTimezone}
                viewerTimezone={viewerTimezone}
                onBookAnother={reset}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
