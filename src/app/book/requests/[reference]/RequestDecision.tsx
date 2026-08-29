'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { approveRequest, declineRequest, type ActionResult } from './actions';
import { cn } from '@/lib/utils';

/**
 * The two buttons that settle a request.
 *
 * Deliberately a form submission rather than a link: the URL in the email opens
 * this page, and nothing is decided until Richie presses something here. Both
 * buttons disable while either is in flight, because approving and declining the
 * same request in the same second is not a state worth supporting.
 */
export function RequestDecision({ reference, token }: { reference: string; token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failure, setFailure] = useState<string | null>(null);

  const settle = (run: () => Promise<ActionResult>) => {
    setFailure(null);
    startTransition(async () => {
      const result = await run();
      if (result.ok) {
        /*
          A green tick claims something was completed *and* went well. Approving
          earns it; declining is equally successful as an action but is not a
          confirmation of anything, so it gets the neutral treatment rather than
          a tick that reads as "meeting booked".
        */
        if (result.confirmed) toast.success('Confirmed', { description: result.message });
        else toast.info('Declined', { description: result.message });
        router.refresh();
      } else {
        setFailure(result.message);
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={pending}
          onClick={() => settle(() => approveRequest(reference, token))}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-lime px-6 py-3.5',
            'font-mono text-xs font-bold uppercase tracking-widest text-black',
            'transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          <Check className="size-4" />
          {pending ? 'Working…' : 'Approve'}
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() => settle(() => declineRequest(reference, token))}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-hairline px-6 py-3.5',
            'font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground',
            'transition-colors hover:border-white/25 hover:text-foreground',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          <X className="size-4" />
          Decline
        </button>
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
        Approving sends the calendar invitation. Declining releases the slot and lets them know.
      </p>

      {failure ? (
        <p role="alert" className="mt-4 text-center text-sm text-[#ff5c5c]">
          {failure}
        </p>
      ) : null}
    </div>
  );
}
