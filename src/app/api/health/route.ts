import { NextResponse } from 'next/server';
import { Container, type ContainerCapabilities } from '@/infrastructure/Container';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Reports which adapters resolved to real implementations and — crucially —
 * whether the calendar actually *works*, not just whether credentials are
 * present. Setting a wrong refresh token resolves the live adapter but fails on
 * every call, so `?probe=1` performs a real free/busy read and reports the error.
 */
export async function GET(request: Request) {
  const container = Container.resolve();
  const capabilities = container.capabilities;
  const probe = new URL(request.url).searchParams.get('probe') === '1';

  let calendarProbe: { ok: boolean; detail: string } | undefined;

  if (probe) {
    const now = container.clock.now();
    try {
      const busy = await container.calendar.busyIntervals(now, now.plus({ days: 1 }));
      calendarProbe = { ok: true, detail: `read ${busy.length} busy interval(s) for the next 24h` };
    } catch (error) {
      calendarProbe = { ok: false, detail: (error as Error).message };
    }
  }

  return NextResponse.json({
    status: 'ok',
    time: container.clock.now().toISO(),
    ...capabilities,
    ...(calendarProbe ? { calendarProbe } : {}),
    policy: container.policy.toClientConfig(),
    hints: buildHints(capabilities, calendarProbe),
  });
}

function buildHints(
  capabilities: ContainerCapabilities,
  probe?: { ok: boolean; detail: string },
): string[] {
  const hints: string[] = [];

  if (!capabilities.calendarLive) {
    hints.push(
      'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN to read real availability and send invites.',
    );
  }

  if (probe && !probe.ok) {
    hints.push(
      `Calendar credentials are set but the API rejected them: ${probe.detail}. ` +
        'If this says "invalid_grant", the refresh token is wrong or revoked — run `npm run auth:google` to mint a new one. ' +
        'A refresh token starts with "1//" and is not the same value as the client ID.',
    );
  }

  if (!capabilities.repositoryDurable) {
    hints.push('Set DATABASE_URL to persist bookings across deploys.');
  }

  if (capabilities.notifier === 'console') {
    hints.push('Set RESEND_API_KEY to email confirmations in addition to the calendar invite.');
  }

  if (!hints.length) hints.push('Everything is configured.');

  return hints;
}
