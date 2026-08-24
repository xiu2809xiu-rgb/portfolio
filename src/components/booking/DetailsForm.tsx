'use client';

import { useState, type FormEvent } from 'react';
import { DateTime } from 'luxon';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { AvailabilitySlot } from './types';

export interface BookingDetails {
  name: string;
  email: string;
  topic: string;
  note: string;
  company: string;
}

interface DetailsFormProps {
  slot: AvailabilitySlot;
  durationMinutes: number;
  ownerTimezone: string;
  viewerTimezone: string;
  submitting: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  onBack: () => void;
  onSubmit: (details: BookingDetails) => void;
}

const TOPIC_SUGGESTIONS = [
  'Internship opportunity',
  'Project collaboration',
  'Code review',
  'Just a chat',
];

export function DetailsForm({
  slot,
  durationMinutes,
  ownerTimezone,
  viewerTimezone,
  submitting,
  error,
  fieldErrors,
  onBack,
  onSubmit,
}: DetailsFormProps) {
  const [details, setDetails] = useState<BookingDetails>({
    name: '',
    email: '',
    topic: '',
    note: '',
    company: '',
  });

  const update = <K extends keyof BookingDetails>(key: K, value: BookingDetails[K]) =>
    setDetails((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!submitting) onSubmit(details);
  };

  const start = DateTime.fromISO(slot.start);
  const ownerLabel = start.setZone(ownerTimezone).setLocale('en-US').toFormat("cccc d LLLL 'at' h:mm a");
  const viewerLabel = start.setZone(viewerTimezone).setLocale('en-US').toFormat("cccc d LLLL 'at' h:mm a");

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="rounded-xl border border-lime/25 bg-lime/[0.07] p-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-widest text-lime">
          {durationMinutes} minute session
        </p>
        <p className="mt-1.5 font-heading text-base font-semibold">{ownerLabel}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          {ownerTimezone.split('/')[1]?.replace('_', ' ') ?? ownerTimezone} time
          {viewerTimezone !== ownerTimezone ? ` · ${viewerLabel} your time` : ''}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="booking-name">
            Name <span className="text-lime">*</span>
          </Label>
          <Input
            id="booking-name"
            value={details.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Jamie Tan"
            autoComplete="name"
            required
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'booking-name-error' : undefined}
          />
          {fieldErrors.name ? (
            <p id="booking-name-error" className="text-xs text-destructive">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="booking-email">
            Email <span className="text-lime">*</span>
          </Label>
          <Input
            id="booking-email"
            type="email"
            value={details.email}
            onChange={(event) => update('email', event.target.value)}
            placeholder="jamie@company.com"
            autoComplete="email"
            required
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'booking-email-error' : undefined}
          />
          {fieldErrors.email ? (
            <p id="booking-email-error" className="text-xs text-destructive">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="booking-topic">What is it about?</Label>
        <Input
          id="booking-topic"
          value={details.topic}
          onChange={(event) => update('topic', event.target.value)}
          placeholder="Internship opportunity"
          maxLength={120}
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {TOPIC_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => update('topic', suggestion)}
              className={cn(
                'rounded-full border px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-wider transition-colors',
                details.topic === suggestion
                  ? 'border-lime/50 bg-lime/10 text-lime'
                  : 'border-hairline text-muted-foreground hover:border-lime/30 hover:text-foreground',
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="booking-note">Anything I should read first?</Label>
        <textarea
          id="booking-note"
          value={details.note}
          onChange={(event) => update('note', event.target.value)}
          rows={4}
          maxLength={800}
          placeholder="A link, some context, or a question you want answered."
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <p className="text-right font-mono text-[0.62rem] text-muted-foreground">
          {details.note.length}/800
        </p>
      </div>

      {/* Honeypot — visually and semantically hidden from real users. */}
      <div aria-hidden className="absolute left-[-9999px] top-0 size-px overflow-hidden">
        <label htmlFor="booking-company">Company (leave blank)</label>
        <input
          id="booking-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={details.company}
          onChange={(event) => update('company', event.target.value)}
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive-foreground"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={submitting}
          className="gap-1.5"
        >
          <ArrowLeft className="size-4" />
          Change time
        </Button>

        <Button
          type="submit"
          disabled={submitting}
          className="ml-auto min-w-[10rem] gap-2 bg-lime font-mono text-xs uppercase tracking-widest text-black hover:bg-lime/90"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Confirming…
            </>
          ) : (
            'Confirm booking'
          )}
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Your details are used to create the calendar invite and nothing else. No list, no
        newsletter, no third parties.
      </p>
    </form>
  );
}
