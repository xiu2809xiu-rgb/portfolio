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

    await this.send({
      to: attendee.email,
      subject: `Confirmed: ${booking.duration.label} with Richie Koh`,
      html: this.attendeeEmail(booking, whenTheirTime),
    });

    if (this.ownerEmail) {
      await this.send({
        to: this.ownerEmail,
        subject: `New booking — ${attendee.name} (${booking.reference})`,
        html: this.ownerEmailBody(booking),
      });
    }
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

  async bookingConfirmed(booking: Booking): Promise<void> {
    console.info(
      `[booking] ${booking.reference} — ${booking.attendee.name} <${booking.attendee.email}> ` +
        `for ${booking.duration.label} at ${booking.slot.start.toISO()}`,
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
