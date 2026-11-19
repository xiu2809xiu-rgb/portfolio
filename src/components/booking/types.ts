import type { DurationMinutes } from '@/core/booking/domain/Duration';

export type SlotState = 'free' | 'busy' | 'past' | 'notice';
export type DayState = 'open' | 'limited' | 'full' | 'closed' | 'past';

export interface AvailabilitySlot {
  start: string;
  end: string;
  state: SlotState;
  label: string;
}

export interface PolicyConfig {
  timezone: string;
  /* readonly throughout: this crosses the server/client boundary as data, and
     nothing on the client has any business mutating the policy it was handed. */
  workingDays: readonly number[];
  windows: readonly { from: string; to: string }[];
  slotIntervalMinutes: number;
  minimumNoticeMinutes: number;
  bookingHorizonDays: number;
  /** Hours a request is held while it waits for Richie's answer. */
  approvalWindowHours: number;
  durations: readonly DurationMinutes[];
}

export interface DayResponse {
  date: string;
  weekday: number;
  isWorkingDay: boolean;
  slots: AvailabilitySlot[];
  freeCount: number;
  atCapacity: boolean;
  duration: number;
  config: PolicyConfig;
  live: boolean;
}

export interface MonthDaySummary {
  date: string;
  isWorkingDay: boolean;
  freeCount: number;
  totalCount: number;
  state: DayState;
}

export interface MonthResponse {
  month: string;
  duration: number;
  days: MonthDaySummary[];
  config: PolicyConfig;
  live: boolean;
}

export interface BookingConfirmation {
  reference: string;
  status: string;
  start: string;
  end: string;
  duration: number;
  meetingUrl: string | null;
  /** ISO instant the hold lapses if Richie has not answered. */
  holdExpiresAt: string | null;
  live: boolean;
}

/** One field the API rejected. */
export interface ApiIssue {
  field: string;
  message: string;
  /** Zod's issue code (`too_small`, `too_big`, `invalid_format`), for pages not in English. */
  code?: string;
}

/**
 * A refusal from the booking API. `error` is the stable machine-readable code;
 * `message` is a sentence in English, written for the English page.
 */
export interface ApiError {
  error: string;
  message: string;
  issues?: ApiIssue[];
}

/** The three-step wizard state. */
export type BookingStep = 'when' | 'details' | 'done';

/**
 * The order the legend lists the states in. What each one is called lives in
 * the booking dictionary, keyed by state, so a state added to the union above
 * fails to compile until it has a name in both languages.
 */
export const SLOT_LEGEND: readonly SlotState[] = ['free', 'busy', 'notice', 'past'];
