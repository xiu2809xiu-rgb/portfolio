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
  workingDays: number[];
  windows: { from: string; to: string }[];
  slotIntervalMinutes: number;
  minimumNoticeMinutes: number;
  bookingHorizonDays: number;
  durations: DurationMinutes[];
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
  live: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  issues?: { field: string; message: string }[];
}

/** The three-step wizard state. */
export type BookingStep = 'when' | 'details' | 'done';

/** Legend copy, kept beside the state union so the two never drift apart. */
export const SLOT_LEGEND: ReadonlyArray<{
  state: SlotState;
  label: string;
  description: string;
}> = [
  { state: 'free', label: 'Free', description: 'Open — pick it and it is yours.' },
  { state: 'busy', label: 'Busy', description: 'Already booked or blocked on my calendar.' },
  { state: 'notice', label: 'Too soon', description: 'Inside my minimum notice window.' },
  { state: 'past', label: 'Past', description: 'This time has already gone.' },
];
