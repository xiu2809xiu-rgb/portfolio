/**
 * The intro curtain's one question — "should it show?" — in the two forms it is
 * asked: an inline script that runs before first paint, and a function React
 * can call.
 *
 * This file deliberately has no 'use client' directive, and the script must
 * stay here rather than beside the component that uses its answer.
 *
 * The root layout is a Server Component and inlines {@link introGuardScript}
 * into `<head>`. A value imported from a client module does not arrive there as
 * a string: the server sends a reference to the module, and the browser has to
 * load that module's chunk before it knows what the script says. Until then the
 * `<script>` is a placeholder, and `<head>` has to wait for it.
 *
 * React walks `<head>` with a cursor it saves on the way in and restores on the
 * way out. When the head waits and is then started a second time, the saved
 * position is overwritten with one inside the head; the body's first elements
 * are matched against the head's, nothing lines up, and React discards the
 * whole server-rendered document and builds it again in the browser (error
 * #418). It needs the chunk to land in the few milliseconds between the two
 * attempts, so it surfaces as an occasional full-page flash on a slow or busy
 * device and never on a fast one.
 *
 * Exported from a plain module, the string is part of the server's HTML and
 * nothing in `<head>` ever waits.
 */

const SEEN_KEY = 'rk:intro-seen';

/** Remembers, for this tab, that the curtain has been shown. */
export function markIntroSeen(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Private mode can throw; the curtain simply shows again next time.
  }
}

/** The guard's question, askable from React. Must stay in step with the script below. */
export function shouldSkipIntro(): boolean {
  try {
    return (
      sessionStorage.getItem(SEEN_KEY) === '1' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return false;
  }
}

/**
 * Runs before first paint, in the document head.
 *
 * Marks the document so repeat visitors and reduced-motion visitors never see
 * the curtain at all — not even for the single frame it would take React to
 * hydrate and remove it. Same technique as a theme-flash guard.
 */
export const introGuardScript: string = `(function(){try{
var seen=sessionStorage.getItem('${SEEN_KEY}')==='1';
var calm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(seen||calm){document.documentElement.dataset.intro='skip';}
}catch(e){}})();`;
