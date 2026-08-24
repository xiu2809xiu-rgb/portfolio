import { NextResponse } from 'next/server';
import { Container, type ContainerCapabilities } from '@/infrastructure/Container';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Reports which adapters resolved to real implementations. Useful after adding a
 * secret in Vercel: hit this and you can see whether the calendar actually went
 * live without booking a test session.
 */
export async function GET() {
  const container = Container.resolve();
  const capabilities = container.capabilities;

  return NextResponse.json({
    status: 'ok',
    time: container.clock.now().toISO(),
    ...capabilities,
    policy: container.policy.toClientConfig(),
    hints: buildHints(capabilities),
  });
}

function buildHints(capabilities: ContainerCapabilities): string[] {
  const hints: string[] = [];
  if (!capabilities.calendarLive) {
    hints.push('Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN to read real availability and send invites.');
  }
  if (!capabilities.repositoryDurable) {
    hints.push('Set DATABASE_URL to persist bookings across deploys.');
  }
  if (capabilities.notifier === 'console') {
    hints.push('Set RESEND_API_KEY to email confirmations in addition to the calendar invite.');
  }
  return hints;
}
