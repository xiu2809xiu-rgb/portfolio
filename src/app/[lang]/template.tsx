'use client';

import { motion } from 'motion/react';

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
 *
 * Reduced motion is honoured in CSS, not here: `.route-enter` is pinned to its
 * finished state under `prefers-reduced-motion` (globals.css), so those visitors
 * get the page at once — including before any JavaScript has run, which a branch
 * in this component could never manage.
 *
 * This used to return the children without the wrapper when the preference was
 * set. The preference is only known once the page has hydrated, so the wrapper
 * was rendered, hydrated and then taken away — and taking away an element this
 * high in the tree unmounts everything under it. For exactly the visitors who
 * asked for less movement, the whole page was torn down and built a second time,
 * every client component mounting twice. The element must be the same on both
 * sides of hydration; only how it looks may differ.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="route-enter"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
