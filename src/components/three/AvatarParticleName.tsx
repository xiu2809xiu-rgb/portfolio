'use client';

import { BrandParticleText } from '@/components/common/BrandParticleText';
import { cn } from '@/lib/utils';

/**
 * Particle wordmark sitting under the avatar.
 *
 * All the ParticleText quirks — font resolution, the hardcoded min-height, the
 * spring tuning — live in {@link BrandParticleText}, which the reboot sequence
 * shares. This only picks the size.
 */
export function AvatarParticleName({ className }: { className?: string }) {
  return (
    <BrandParticleText
      text="richie koh"
      // The canvas sizes itself from this container, so it needs a real height.
      className={cn('h-[132px]', className)}
      fallback={
        <p
          className={cn(
            'text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl',
            className,
          )}
        >
          Koh Shan Shun<span className="text-lime">.</span>
        </p>
      }
    />
  );
}
