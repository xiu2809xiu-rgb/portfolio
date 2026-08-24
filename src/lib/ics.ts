import { DateTime } from 'luxon';

export interface CalendarEventInput {
  title: string;
  description: string;
  start: string;
  end: string;
  organiserName: string;
  organiserEmail: string;
  url: string;
  uid: string;
  location?: string;
}

/** RFC 5545 wants CRLF, escaped separators, and lines folded at 75 octets. */
const escapeText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest) parts.push(` ${rest}`);
  return parts.join('\r\n');
}

const stamp = (iso: string) => DateTime.fromISO(iso).toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");

/**
 * Builds an .ics file for a confirmed booking.
 *
 * Google already emails a proper invite, so this is the escape hatch for people
 * on Outlook, Apple Calendar, or a corporate client that will not accept a Google
 * invite — they get the same event as a file they can open anywhere.
 */
export function buildIcs(event: CalendarEventInput): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//richiekoh.dev//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}@richiekoh.dev`,
    `DTSTAMP:${stamp(DateTime.utc().toISO()!)}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    event.location ? `LOCATION:${escapeText(event.location)}` : null,
    `URL:${event.url}`,
    `ORGANIZER;CN=${escapeText(event.organiserName)}:mailto:${event.organiserEmail}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((line): line is string => line !== null);

  return lines.map(fold).join('\r\n');
}

/** Triggers a browser download for the generated calendar file. */
export function downloadIcs(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking immediately can cancel the download in Safari; one tick is enough.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
