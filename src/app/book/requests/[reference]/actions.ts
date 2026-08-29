'use server';

import { revalidatePath } from 'next/cache';
import { Container } from '@/infrastructure/Container';

export interface ActionResult {
  ok: boolean;
  message: string;
}

/**
 * Answering a request is a POST, never a GET.
 *
 * The link that reaches Richie's inbox only *opens* this page; the decision is
 * made by submitting a form on it. Mail clients, spam filters and link-preview
 * bots follow URLs in email without being asked, so a GET that approved a
 * meeting outright would eventually be decided by a security scanner rather
 * than by him.
 */
async function answer(
  action: 'approve' | 'decline',
  reference: string,
  token: string,
): Promise<ActionResult> {
  const container = Container.resolve();

  try {
    const booking =
      action === 'approve'
        ? await container.bookings.approve(reference, token)
        : await container.bookings.decline(reference, token);

    revalidatePath(`/book/requests/${reference}`);

    return {
      ok: true,
      message:
        booking.status === 'confirmed'
          ? `Confirmed. ${booking.attendee.firstName} has been sent the invitation.`
          : `Declined. ${booking.attendee.firstName} has been told, and the slot is free again.`,
    };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

export async function approveRequest(reference: string, token: string): Promise<ActionResult> {
  return answer('approve', reference, token);
}

export async function declineRequest(reference: string, token: string): Promise<ActionResult> {
  return answer('decline', reference, token);
}
