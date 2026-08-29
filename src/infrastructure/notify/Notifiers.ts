import type { Booking } from '@/core/booking/domain/Booking';
import type { NotifierPort } from '@/core/booking/ports';

/**
 * Email notifier backed by Resend.
 *
 * Google already emails the calendar invite, so this is the *extra* touch: a
 * branded confirmation to the attendee and a heads-up to Richie. Because it is
 * strictly additive, {@link BookingService} swallows its failures.
 */
export class ResendNotifier implements NotifierPort {
  readonly name = 'resend';

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly ownerEmail: string,
    private readonly siteUrl: string,
  ) {}

  static fromEnv(env: NodeJS.ProcessEnv = process.env): ResendNotifier | null {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) return null;

    return new ResendNotifier(
      apiKey,
      env.RESEND_FROM || 'Richie Koh <onboarding@resend.dev>',
      env.BOOKING_OWNER_EMAIL || '',
      env.NEXT_PUBLIC_SITE_URL || 'https://richiekoh.dev',
    );
  }

  async bookingConfirmed(booking: Booking): Promise<void> {
    const { attendee } = booking;
    const whenTheirTime = booking.slot.start
      .setZone(attendee.timezone)
      .toFormat("cccc d LLLL yyyy 'at' h:mm a (ZZZZ)");

    /*
      Two independent messages, attempted independently.

      The attendee's is by far the likelier to be rejected: until a sending
      domain is verified, Resend will only deliver to the account holder's own
      address, so every real visitor's confirmation bounces at the API. Awaiting
      it first meant that rejection threw before the owner notification was even
      attempted — and BookingService treats a failed notification as non-fatal,
      so the whole thing vanished. The one message telling Richie a booking had
      happened was the one guaranteed not to arrive.

      Failures are logged rather than raised, for the same reason: the caller
      swallows them, and silence is indistinguishable from success. A line in the
      runtime log is the only signal that email is misconfigured.
    */
    await this.dispatch(booking, [
      {
        who: 'attendee',
        to: attendee.email,
        subject: `Confirmed: ${booking.duration.label} with Richie Koh`,
        html: this.attendeeEmail(booking, whenTheirTime),
      },
      ...(this.ownerEmail
        ? [
            {
              who: 'owner',
              to: this.ownerEmail,
              subject: `Confirmed — ${attendee.name} (${booking.reference})`,
              html: this.ownerEmailBody(booking),
            },
          ]
        : []),
    ]);
  }

  /**
   * Sends every message independently and logs rather than raises.
   *
   * One recipient failing must not silence the others — the attendee address is
   * by far the likelier to be rejected, and it used to take the owner's copy
   * down with it. And because the caller treats notification failure as
   * non-fatal, silence would be indistinguishable from success: the log line is
   * the only signal that email is misconfigured.
   */
  private async dispatch(
    booking: Booking,
    messages: readonly { who: string; to: string; subject: string; html: string }[],
  ): Promise<void> {
    await Promise.all(
      messages.map(async ({ who, ...message }) => {
        try {
          await this.send(message);
        } catch (error) {
          console.error(
            `[notify] ${who} email for ${booking.reference} was not sent: ${(error as Error).message}`,
          );
        }
      }),
    );
  }

  /**
   * The moment a request arrives: Richie is asked to decide, the visitor is told
   * their slot is held. Neither message says the meeting is happening.
   */
  async bookingRequested(booking: Booking, manageUrl: string): Promise<void> {
    const { attendee } = booking;
    const whenTheirTime = this.inZone(booking, attendee.timezone);
    const deadline = booking.holdExpiresAt
      .setZone(attendee.timezone)
      .toFormat("cccc d LLLL 'at' h:mm a (ZZZZ)");

    await this.dispatch(booking, [
      {
        who: 'attendee',
        to: attendee.email,
        subject: `Request received: ${booking.duration.label} with Richie Koh`,
        html: this.attendeeHeldEmail(booking, whenTheirTime, deadline),
      },
      ...(this.ownerEmail
        ? [
            {
              who: 'owner',
              to: this.ownerEmail,
              subject: `Approve or decline — ${attendee.name} (${booking.reference})`,
              html: this.ownerRequestEmail(booking, manageUrl),
            },
          ]
        : []),
    ]);
  }

  async bookingDeclined(booking: Booking): Promise<void> {
    const { attendee } = booking;
    await this.dispatch(booking, [
      {
        who: 'attendee',
        to: attendee.email,
        subject: `About your ${booking.duration.label} request`,
        html: this.attendeeClosedEmail(
          booking,
          'Sorry — I cannot make that slot after all, so I have released it.',
        ),
      },
    ]);
  }

  async bookingExpired(booking: Booking): Promise<void> {
    const { attendee } = booking;
    await this.dispatch(booking, [
      {
        who: 'attendee',
        to: attendee.email,
        subject: `Your ${booking.duration.label} request has expired`,
        html: this.attendeeClosedEmail(
          booking,
          'I did not get to your request in time, so the hold has been released. ' +
            'Please do pick another slot — I would still like to talk.',
        ),
      },
    ]);
  }

  private inZone(booking: Booking, timezone: string): string {
    return booking.slot.start
      .setZone(timezone)
      .toFormat("cccc d LLLL yyyy 'at' h:mm a (ZZZZ)");
  }

  private async send(message: { to: string; subject: string; html: string }): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, ...message }),
    });

    if (!response.ok) {
      throw new Error(`Resend rejected the message: ${response.status} ${await response.text()}`);
    }
  }

  private attendeeEmail(booking: Booking, when: string): string {
    const { attendee } = booking;
    return `
      <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;color:#111">
        <p style="font-size:15px">Hi ${escapeHtml(attendee.firstName)},</p>
        <p style="font-size:15px;line-height:1.6">
          Your <strong>${booking.duration.label}</strong> session is confirmed. A calendar
          invite is on its way to this address.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
          <tr><td style="padding:6px 0;color:#666">When</td><td style="padding:6px 0"><strong>${escapeHtml(when)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#666">Length</td><td style="padding:6px 0">${booking.duration.label}</td></tr>
          ${attendee.topic ? `<tr><td style="padding:6px 0;color:#666">Topic</td><td style="padding:6px 0">${escapeHtml(attendee.topic)}</td></tr>` : ''}
          <tr><td style="padding:6px 0;color:#666">Reference</td><td style="padding:6px 0"><code>${booking.reference}</code></td></tr>
          ${booking.meetingUrl ? `<tr><td style="padding:6px 0;color:#666">Join</td><td style="padding:6px 0"><a href="${booking.meetingUrl}">${booking.meetingUrl}</a></td></tr>` : ''}
        </table>
        <p style="font-size:13px;color:#666;line-height:1.6">
          Need to change it? Just reply to this email.<br>
          — Richie · <a href="${this.siteUrl}">${this.siteUrl.replace(/^https?:\/\//, '')}</a>
        </p>
      </div>
    `;
  }

  private attendeeHeldEmail(booking: Booking, when: string, deadline: string): string {
    const { attendee } = booking;
    return `
      <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;color:#111">
        <p style="font-size:15px">Hi ${escapeHtml(attendee.firstName)},</p>
        <p style="font-size:15px;line-height:1.6">
          Thanks — I have your request for a <strong>${booking.duration.label}</strong> session,
          and the slot is held for you. I confirm each one myself, so you will get a second
          email from me either way.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
          <tr><td style="padding:6px 0;color:#666">Requested</td><td style="padding:6px 0"><strong>${escapeHtml(when)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#666">Length</td><td style="padding:6px 0">${booking.duration.label}</td></tr>
          ${attendee.topic ? `<tr><td style="padding:6px 0;color:#666">Topic</td><td style="padding:6px 0">${escapeHtml(attendee.topic)}</td></tr>` : ''}
          <tr><td style="padding:6px 0;color:#666">Held until</td><td style="padding:6px 0">${escapeHtml(deadline)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Reference</td><td style="padding:6px 0"><code>${booking.reference}</code></td></tr>
        </table>
        <p style="font-size:13px;color:#666;line-height:1.6">
          If I have not answered by then the hold is released automatically and you are free to
          pick another time. Reply to this email if anything changes at your end.<br>
          — Richie · <a href="${this.siteUrl}">${this.siteUrl.replace(/^https?:\/\//, '')}</a>
        </p>
      </div>
    `;
  }

  private attendeeClosedEmail(booking: Booking, reason: string): string {
    const { attendee } = booking;
    const when = this.inZone(booking, attendee.timezone);
    return `
      <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;color:#111">
        <p style="font-size:15px">Hi ${escapeHtml(attendee.firstName)},</p>
        <p style="font-size:15px;line-height:1.6">${escapeHtml(reason)}</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
          <tr><td style="padding:6px 0;color:#666">Was</td><td style="padding:6px 0">${escapeHtml(when)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Reference</td><td style="padding:6px 0"><code>${booking.reference}</code></td></tr>
        </table>
        <p style="font-size:14px;line-height:1.6">
          <a href="${this.siteUrl}/book" style="color:#111">Pick another time →</a>
        </p>
        <p style="font-size:13px;color:#666;line-height:1.6">
          — Richie · <a href="${this.siteUrl}">${this.siteUrl.replace(/^https?:\/\//, '')}</a>
        </p>
      </div>
    `;
  }

  /**
   * The only email with an action in it.
   *
   * The buttons are ordinary links to a page that asks again before doing
   * anything — mail scanners and link prefetchers follow URLs in email, and a
   * GET that approved a meeting outright would be decided by a spam filter.
   */
  private ownerRequestEmail(booking: Booking, manageUrl: string): string {
    const { attendee } = booking;
    const sgt = booking.slot.start.setZone('Asia/Singapore').toFormat('ccc d LLL yyyy, h:mm a');
    const deadline = booking.holdExpiresAt
      .setZone('Asia/Singapore')
      .toFormat('ccc d LLL, h:mm a');
    return `
      <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;color:#111">
        <p style="font-size:15px;line-height:1.6">
          <strong>${escapeHtml(attendee.name)}</strong> has asked for
          ${booking.duration.label} on <strong>${escapeHtml(sgt)} SGT</strong>.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px">
          <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0">${escapeHtml(attendee.email)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Their zone</td><td style="padding:6px 0">${escapeHtml(attendee.timezone)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Topic</td><td style="padding:6px 0">${escapeHtml(attendee.topic ?? '—')}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Reference</td><td style="padding:6px 0"><code>${booking.reference}</code></td></tr>
        </table>
        ${attendee.note ? `<p style="font-size:14px;line-height:1.6;color:#333;border-left:3px solid #ddd;padding-left:12px">${escapeHtml(attendee.note).replace(/\n/g, '<br>')}</p>` : ''}
        <p style="margin:26px 0">
          <a href="${manageUrl}"
             style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600">
            Approve or decline →
          </a>
        </p>
        <p style="font-size:13px;color:#666;line-height:1.6">
          The slot is held on your calendar as tentative until
          <strong>${escapeHtml(deadline)} SGT</strong>. If you do nothing it is released and
          ${escapeHtml(attendee.firstName)} is told.
        </p>
      </div>
    `;
  }

  private ownerEmailBody(booking: Booking): string {
    const { attendee } = booking;
    return `
      <div style="font-family:ui-monospace,monospace;font-size:14px;line-height:1.7">
        <p><strong>${escapeHtml(attendee.name)}</strong> booked ${booking.duration.label}.</p>
        <p>
          When: ${escapeHtml(booking.slot.start.setZone('Asia/Singapore').toFormat('ccc d LLL, h:mm a'))} SGT<br>
          Email: ${escapeHtml(attendee.email)}<br>
          Their zone: ${escapeHtml(attendee.timezone)}<br>
          Topic: ${escapeHtml(attendee.topic ?? '—')}<br>
          Reference: ${booking.reference}
        </p>
        ${attendee.note ? `<p>Notes:<br>${escapeHtml(attendee.note).replace(/\n/g, '<br>')}</p>` : ''}
      </div>
    `;
  }
}

/** Fallback notifier: logs instead of sending, so local runs stay quiet and free. */
export class ConsoleNotifier implements NotifierPort {
  readonly name = 'console';

  async bookingRequested(booking: Booking, manageUrl: string): Promise<void> {
    ConsoleNotifier.log('requested', booking);
    // Without this the request would be unanswerable on a machine with no email.
    console.info(`[booking] approve or decline: ${manageUrl}`);
  }

  async bookingConfirmed(booking: Booking): Promise<void> {
    ConsoleNotifier.log('confirmed', booking);
  }

  async bookingDeclined(booking: Booking): Promise<void> {
    ConsoleNotifier.log('declined', booking);
  }

  async bookingExpired(booking: Booking): Promise<void> {
    ConsoleNotifier.log('expired', booking);
  }

  private static log(event: string, booking: Booking): void {
    console.info(
      `[booking] ${event} ${booking.reference} — ${booking.attendee.name} ` +
        `<${booking.attendee.email}> for ${booking.duration.label} at ${booking.slot.start.toISO()}`,
    );
  }
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Attendee-supplied text lands in an HTML email — escape it before it does. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}
