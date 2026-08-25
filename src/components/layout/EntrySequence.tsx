'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { profile } from '@/content/profile';

/**
 * Brief branded entry curtain, shown once per session.
 *
 * The original site ran a fake percentage counter on a timer, which is the thing
 * everyone rightly complains about — it lies, and it holds the page hostage for a
 * fixed duration whether or not anything is loading. This waits on the real
 * `document.readyState` and caps itself at 1.4s, so a fast connection gets a
 * flash of brand and a slow one is never stuck behind it.
 *
 * The curtain renders in the server HTML so there is no gap before it covers the
 * page. Repeat visits and reduced-motion are handled by {@link introGuardScript},
 * which runs before first paint — deciding that in an effect would show the
 * curtain for a frame before removing it, which is worse than not having one.
 */
export function EntrySequence() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const root = document.documentElement;

    // The pre-paint guard already decided this visitor should not see it, and
    // CSS has it hidden. Unmount on the next frame purely to get it out of the
    // DOM — doing it synchronously here would just cost an extra render pass.
    if (root.dataset.intro === 'skip') {
      const frame = requestAnimationFrame(() => setVisible(false));
      return () => cancelAnimationFrame(frame);
    }

    let done = false;
    const dismiss = () => {
      if (done) return;
      done = true;
      setVisible(false);
      try {
        sessionStorage.setItem('rk:intro-seen', '1');
      } catch {
        // Private mode can throw; the curtain simply shows again next time.
      }
    };

    // Whichever comes first: the document finishing, or the hard cap.
    const cap = setTimeout(dismiss, 1400);
    const onReady = () => {
      if (document.readyState === 'complete') setTimeout(dismiss, 260);
    };

    onReady();
    document.addEventListener('readystatechange', onReady);

    return () => {
      clearTimeout(cap);
      document.removeEventListener('readystatechange', onReady);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="intro"
          data-intro-curtain
          className="fixed inset-0 z-[300] grid place-items-center bg-[#05070a]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
          aria-hidden="true"
        >
          <div className="flex flex-col items-center">
            <motion.p
              className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              RICHIE<span className="text-lime">.</span>KOH
            </motion.p>

            <motion.div
              className="mt-5 h-px w-40 origin-left bg-gradient-to-r from-lime to-aqua"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />

            <motion.p
              className="mt-4 font-mono text-[0.62rem] uppercase tracking-[0.3em] text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              {profile.role}
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Runs before first paint, in the document head.
 *
 * Marks the document so repeat visitors and reduced-motion visitors never see
 * the curtain at all — not even for the single frame it would take React to
 * hydrate and remove it. Same technique as a theme-flash guard.
 */
export const introGuardScript = `(function(){try{
var seen=sessionStorage.getItem('rk:intro-seen')==='1';
var calm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(seen||calm){document.documentElement.dataset.intro='skip';}
}catch(e){}})();`;
