import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { ALLOWED_DURATIONS } from '@/core/booking/domain/Duration';
import { isBookingError } from '@/core/booking/domain/errors';
import { Container } from '@/infrastructure/Container';
import { rateLimit } from '@/infrastructure/security/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Request shape. Zod guards the wire format; the domain value objects then guard
 * the *rules*. Both layers matter — this one stops a malformed body reaching the
 * domain, the domain stops a well-formed but illegal booking.
 */
const createBookingSchema = z.object({
  start: z.string().min(1, 'Pick a time slot.'),
  duration: z
    .number()
    .int()
    .refine((value) => (ALLOWED_DURATIONS as readonly number[]).includes(value), {
      message: `Duration must be one of ${ALLOWED_DURATIONS.join(', ')} minutes.`,
    }),
  name: z.string().trim().min(2, 'Please give your name.').max(80),
  email: z.string().trim().email('Please give a valid email address.').max(254),
  topic: z.string().trim().max(120).optional().nullable(),
  note: z.string().trim().max(800).optional().nullable(),
  timezone: z.string().trim().max(64).optional().nullable(),
  /** Honeypot — real people never fill this in. */
  company: z.string().max(0).optional(),
});

/** POST /api/bookings — create a confirmed session. */
export async function POST(request: NextRequest) {
  const container = Container.resolve();

  const limit = rateLimit(request, { key: 'bookings', limit: 5, windowMs: 10 * 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'rate_limited', message: 'Too many booking attempts. Try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_request', message: 'Request body must be JSON.' },
      { status: 400 },
    );
  }

  const parsed = createBookingSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'invalid_request',
        message: parsed.error.issues[0]?.message ?? 'Please check the form and try again.',
        issues: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  // Silently accept the honeypot so bots do not learn they were caught.
  if (parsed.data.company) {
    return NextResponse.json({ reference: 'RK-000000', status: 'confirmed' }, { status: 201 });
  }

  try {
    const booking = await container.bookings.create({
      startISO: parsed.data.start,
      durationMinutes: parsed.data.duration,
      attendee: {
        name: parsed.data.name,
        email: parsed.data.email,
        topic: parsed.data.topic ?? null,
        note: parsed.data.note ?? null,
        timezone: parsed.data.timezone ?? null,
      },
    });

    return NextResponse.json(
      {
        reference: booking.reference,
        status: booking.status,
        start: booking.slot.start.toISO(),
        end: booking.slot.end.toISO(),
        duration: booking.duration.minutes,
        meetingUrl: booking.meetingUrl,
        // The UI tells the visitor whether a real invite is on its way.
        live: container.calendar.isLive,
      },
      { status: 201 },
    );
  } catch (error) {
    if (isBookingError(error)) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error('[bookings] unexpected failure', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'Could not complete the booking. Please try again.' },
      { status: 500 },
    );
  }
}
