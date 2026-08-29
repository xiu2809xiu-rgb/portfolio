import { NextResponse, type NextRequest } from 'next/server';
import { Duration } from '@/core/booking/domain/Duration';
import { isBookingError } from '@/core/booking/domain/errors';
import { Container } from '@/infrastructure/Container';

export const runtime = 'nodejs';
// Availability is time-sensitive and per-visitor; never serve it from the cache.
export const dynamic = 'force-dynamic';

/**
 * GET /api/availability
 *
 *   ?date=2026-09-14&duration=30   → slots for that day
 *   ?month=2026-09&duration=30     → one summary per day, for the calendar dots
 */
export async function GET(request: NextRequest) {
  const container = Container.resolve();
  const params = request.nextUrl.searchParams;

  try {
    /*
      Release any hold nobody answered in time, before reading availability.

      A lapsed request only matters at the moment someone looks at the calendar,
      and serverless has nowhere dependable to run a timer — so the sweep happens
      here rather than on a schedule. It is one indexed query when there is
      nothing to release, and it guarantees the grid never shows a slot as taken
      by a request that has already run out.
    */
    await container.bookings.releaseLapsed().catch((error) => {
      console.error('[availability] could not release lapsed holds', error);
    });

    const duration = Duration.parse(params.get('duration'));
    const month = params.get('month');
    const date = params.get('date');

    if (month) {
      const days = await container.availability.forMonth(month, duration);
      return NextResponse.json({
        month,
        duration: duration.minutes,
        days,
        config: container.policy.toClientConfig(),
        live: container.calendar.isLive,
      });
    }

    const day = await container.availability.forDay(
      date ?? container.clock.now().setZone(container.policy.timezone).toISODate()!,
      duration,
    );

    return NextResponse.json({
      ...day,
      duration: duration.minutes,
      config: container.policy.toClientConfig(),
      live: container.calendar.isLive,
    });
  } catch (error) {
    if (isBookingError(error)) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error('[availability] unexpected failure', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'Could not load availability. Please try again.' },
      { status: 500 },
    );
  }
}
