'use client';

import { motion, useReducedMotion } from 'motion/react';

/**
 * Route transition wrapper.
 *
 * `template.tsx` rather than `layout.tsx` on purpose: Next remounts a template on
 * every navigation, which is exactly what gives each route a fresh enter
 * animation. A layout persists, so the animation would run once and never again.
 *
 * The movement is small and quick — 12px over 0.4s. Awwwards juries reward
 * "continuous, directed" transitions, but a portfolio is read, not watched, and
 * a long curtain between pages becomes a tax the second time someone navigates.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
