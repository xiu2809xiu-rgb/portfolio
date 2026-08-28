'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const getSnapshot = () => window.matchMedia(QUERY).matches;

/* The server has no media queries, so it always renders the moving version. */
const getServerSnapshot = () => false;

/**
 * `prefers-reduced-motion`, safe to branch the rendered tree on.
 *
 * motion's own `useReducedMotion` reads `matchMedia` inside `useState`'s lazy
 * initialiser — during the first client render. A component that returns a
 * different tree for it therefore renders one thing on the server and a
 * different thing while hydrating, and React throws away the server HTML and
 * re-renders the whole subtree (error #418). That fired on every route here,
 * because the route-transition template branches at the very top of the tree.
 *
 * `useSyncExternalStore` exists for exactly this: the `getServerSnapshot`
 * argument is used for both the server render and the hydration render, so the
 * two agree, and React then re-renders with the real value in the same commit.
 * No mismatch, and unlike motion's hook this one keeps listening, so toggling
 * the OS setting takes effect without a reload.
 *
 * Use this wherever the *markup* changes. For components that only vary
 * animation values — a duration, a distance — motion's hook is fine, since the
 * rendered element is the same either way.
 */
export function useStillness(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
