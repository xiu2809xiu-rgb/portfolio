'use client';

import { useState } from 'react';
import { DateTime } from 'luxon';
import { Calendar, Check, Copy, ExternalLink, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
/*
  The English profile, on purpose: it only feeds the calendar event a visitor
  saves (the .ics file and the Google Calendar link), and calendar events stay
  English — they are read by calendar apps and by Richie as much as the visitor.
*/
import { profile } from '@/content/profile';
import { bookingDict } from '@/i18n/dictionaries/booking';
import { useT } from '@/i18n/LocaleProvider';
import { buildIcs, downloadIcs } from '@/lib/ics';
import { cn } from '@/lib/utils';
import type { BookingConfirmation } from './types';

interface ConfirmationProps {
  confirmation: BookingConfirmation;
  attendeeName: string;
  ownerTimezone: string;
  viewerTimezone: string;
  onBookAnother: () => void;
}

export function Confirmation({
  confirmation,
  attendeeName,
  ownerTimezone,
  viewerTimezone,
  onBookAnother,
}: ConfirmationProps) {
  const { confirmation: t, format } = useT(bookingDict);
  const [copied, setCopied] = useState(false);

  const start = DateTime.fromISO(confirmation.start);
  const viewerLabel = format.fullDateTime(start.setZone(viewerTimezone));
  const ownerLabel = format.time(start.setZone(ownerTimezone));

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(confirmation.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked by permissions; the code is on screen anyway.
    }
  };

  const saveIcs = () => {
    const ics = buildIcs({
      uid: confirmation.reference,
      title: `${confirmation.duration} min with ${profile.fullName}`,
      description: [
        `Booked via ${profile.fullName}'s site.`,
        `Reference: ${confirmation.reference}`,
        confirmation.meetingUrl ? `Join: ${confirmation.meetingUrl}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      start: confirmation.start,
      end: confirmation.end,
      organiserName: profile.fullName,
      organiserEmail: profile.email,
      url: confirmation.meetingUrl ?? 'https://richiekoh.dev/book',
      location: confirmation.meetingUrl ?? 'Google Meet link to follow',
    });
    downloadIcs(`session-${confirmation.reference}`, ics);
  };

  /* The visitor's own timezone, so "by Tuesday 6pm" means their Tuesday. */
  const holdLabel = confirmation.holdExpiresAt
    ? format.dateTime(DateTime.fromISO(confirmation.holdExpiresAt).setZone(viewerTimezone))
    : null;

  const strong = (text: string) => <strong className="text-foreground">{text}</strong>;

  const googleCalendarUrl = (() => {
    const format = (iso: string) => DateTime.fromISO(iso).toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${confirmation.duration} min with ${profile.fullName}`,
      dates: `${format(confirmation.start)}/${format(confirmation.end)}`,
      details: `Reference: ${confirmation.reference}`,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  })();

  return (
    <div className="text-center">
      <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full border border-lime/40 bg-lime/12">
        <Check className="size-7 text-lime" strokeWidth={2.5} />
      </div>

      {/*
        "Requested", not "confirmed". The slot is genuinely held — nobody else can
        take it — but Richie has not agreed to it yet, and a screen that says
        confirmed makes a promise on his behalf that he may not keep. The one
        thing worth being precise about here is the difference between a slot
        being reserved and a person having said yes.
      */}
      <h3 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t.heading}
      </h3>

      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {t.thanks(strong, {
          name: attendeeName,
          minutes: confirmation.duration,
          when: viewerLabel,
          ownerTime: viewerTimezone !== ownerTimezone ? ownerLabel : null,
        })}
      </p>

      {confirmation.live ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t.hearBack(strong, holdLabel)}
        </p>
      ) : (
        <p className="mx-auto mt-3 max-w-md rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs leading-relaxed text-warning">
          {t.demo}
        </p>
      )}

      <div className="mx-auto mt-6 flex max-w-xs items-center justify-between gap-3 rounded-xl border border-hairline bg-white/[0.03] px-4 py-3">
        <div className="text-left">
          <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            {t.reference}
          </p>
          <p className="font-mono text-base font-bold text-lime">{confirmation.reference}</p>
        </div>
        <button
          type="button"
          onClick={copyReference}
          className="grid size-9 place-items-center rounded-lg border border-hairline transition-colors hover:border-lime/40 hover:bg-lime/5"
          aria-label={t.copyReference}
        >
          {copied ? (
            <Check className="size-4 text-lime" />
          ) : (
            <Copy className="size-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/*
        Hidden while the request is only held. A .ics download or a "Join link"
        is a meeting the visitor can put in their own calendar and turn up to —
        which is the same false promise as the old heading, just in a file. They
        appear once Richie has actually approved it.
      */}
      <div
        className={cn(
          'mt-7 flex-wrap items-center justify-center gap-2',
          confirmation.status === 'confirmed' ? 'flex' : 'hidden',
        )}
      >
        <Button onClick={saveIcs} variant="outline" className="gap-2">
          <Calendar className="size-4" />
          {t.downloadIcs}
        </Button>

        <a
          href={googleCalendarUrl}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <ExternalLink className="size-4" />
          {t.addToGoogle}
        </a>

        {confirmation.meetingUrl ? (
          <a
            href={confirmation.meetingUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-lime px-4 text-sm font-medium text-black transition-colors hover:bg-lime/90"
          >
            <Video className="size-4" />
            {t.join}
          </a>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onBookAnother}
        className="link-underline mt-8 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        {t.bookAnother}
      </button>
    </div>
  );
}
