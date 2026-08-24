import { NextResponse, type NextRequest } from 'next/server';
import { isBookingError } from '@/core/booking/domain/errors';
import { Container } from '@/infrastructure/Container';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ reference: string }>;
}

/** GET /api/bookings/RK-XXXXXX — look up a confirmation. */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { reference } = await context.params;
  const container = Container.resolve();

  try {
    const booking = await container.bookings.findByReference(reference);
    return NextResponse.json({
      reference: booking.reference,
      status: booking.status,
      start: booking.slot.start.toISO(),
      end: booking.slot.end.toISO(),
      duration: booking.duration.minutes,
      attendeeName: booking.attendee.name,
      meetingUrl: booking.meetingUrl,
    });
  } catch (error) {
    if (isBookingError(error)) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error('[bookings/:reference] unexpected failure', error);
    return NextResponse.json({ error: 'internal_error', message: 'Lookup failed.' }, { status: 500 });
  }
}
