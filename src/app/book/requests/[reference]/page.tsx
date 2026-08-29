import type { Metadata } from 'next';
import { Container } from '@/infrastructure/Container';
import { RequestDecision } from './RequestDecision';

export const metadata: Metadata = {
  title: 'Booking request',
  // Nothing here should ever be indexed: the URL carries a bearer token.
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ token?: string }>;
}

const STATUS_COPY: Record<string, { heading: string; body: string }> = {
  confirmed: {
    heading: 'Already confirmed',
    body: 'You approved this one. The attendee has the invitation and the slot is on your calendar.',
  },
  declined: {
    heading: 'Already declined',
    body: 'You turned this one down. The attendee was told and the slot went back into the calendar.',
  },
  expired: {
    heading: 'This request expired',
    body: 'The hold ran out before it was answered, so the slot was released automatically and the attendee was told.',
  },
  cancelled: {
    heading: 'This booking was cancelled',
    body: 'Nothing left to decide.',
  },
};

export default async function BookingRequestPage({ params, searchParams }: PageProps) {
  const { reference } = await params;
  const { token } = await searchParams;
  const container = Container.resolve();

  /*
    Release lapsed holds before reading, so a request that ran out while the
    email sat unread shows as expired rather than offering an Approve button
    that would immediately refuse.
  */
  await container.bookings.releaseLapsed().catch(() => undefined);

  const booking = await container.bookings.findByReference(reference).catch(() => null);

  /*
    A wrong token and a non-existent reference produce the identical page. The
    reference is short enough to guess at; the token is not, and the two must not
    be distinguishable or the reference space becomes enumerable.
  */
  if (!booking || !token || booking.actionToken !== token) {
    return (
      <Shell eyebrow="~/richie/requests">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
          Nothing to see here
        </h1>
        <p className="mt-4 text-muted-foreground">
          This link is not valid. It may have been mistyped, or the request it pointed at is long
          gone.
        </p>
      </Shell>
    );
  }

  const attendeeWhen = booking.slot.start
    .setZone(booking.attendee.timezone)
    .toFormat("cccc d LLLL yyyy 'at' h:mm a (ZZZZ)");
  const localWhen = booking.slot.start
    .setZone('Asia/Singapore')
    .toFormat("cccc d LLLL yyyy 'at' h:mm a");
  const heldUntil = booking.holdExpiresAt
    .setZone('Asia/Singapore')
    .toFormat("cccc d LLLL 'at' h:mm a");

  const settled = STATUS_COPY[booking.status];

  return (
    <Shell eyebrow={`~/richie/requests/${booking.reference.toLowerCase()}`}>
      <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
        {settled ? settled.heading : (
          <>
            {booking.attendee.name} wants{' '}
            <span className="text-gradient-lime">{booking.duration.label}</span>
          </>
        )}
      </h1>

      {settled ? (
        <p className="mt-4 text-muted-foreground">{settled.body}</p>
      ) : (
        <p className="mt-4 text-muted-foreground">
          Held on your calendar as tentative until{' '}
          <strong className="text-foreground">{heldUntil} SGT</strong>. Do nothing and it releases
          itself.
        </p>
      )}

      <dl className="glass mt-10 grid gap-px overflow-hidden rounded-2xl sm:grid-cols-2">
        <Field label="Your time" value={`${localWhen} SGT`} />
        <Field label="Their time" value={attendeeWhen} />
        <Field label="Name" value={booking.attendee.name} />
        <Field label="Email" value={booking.attendee.email} />
        <Field label="Topic" value={booking.attendee.topic ?? '—'} />
        <Field label="Reference" value={booking.reference} mono />
      </dl>

      {booking.attendee.note ? (
        <div className="mt-6 rounded-2xl border border-hairline bg-white/[0.02] p-5">
          <p className="eyebrow">What they wrote</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {booking.attendee.note}
          </p>
        </div>
      ) : null}

      {settled ? null : (
        <RequestDecision reference={booking.reference} token={token} />
      )}
    </Shell>
  );
}

function Shell({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="wrap pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-[#0b0e13] p-5">
      <dt className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className={`mt-1.5 text-sm ${mono ? 'font-mono text-lime' : ''}`}>{value}</dd>
    </div>
  );
}
