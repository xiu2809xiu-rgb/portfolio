'use client';

import dynamic from 'next/dynamic';

const GlitchText = dynamic(() => import('@/components/react-bits/glitch-text'), {
  ssr: false,
  // Reserve the canvas height so the heading below does not jump on hydration.
  loading: () => (
    <p className="font-heading text-[7rem] font-extrabold leading-none tracking-tight text-lime/20">
      404
    </p>
  ),
});

/**
 * Canvas-rendered "404" that glitches under the cursor.
 *
 * Client-only and isolated in its own component so the rest of the not-found
 * page stays a server component — a 404 should not ship a bundle to say so.
 */
export function NotFoundGlitch() {
  return (
    <div className="h-40 w-full max-w-md" aria-hidden="true">
      <GlitchText
        text="404"
        fontSize={140}
        fontWeight="800"
        textColor="#e9ecef"
        colors={['#b4ff39', '#39ffd8', '#ff6b39']}
        radius={140}
        textAlign="center"
        fadeIn
        autoFit
        className="size-full"
      />
      <span className="sr-only">404</span>
    </div>
  );
}
