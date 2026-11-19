'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { profileContent } from '@/content/localized/profile';
import { useT } from '@/i18n/LocaleProvider';
import { markIntroSeen, shouldSkipIntro } from './intro-guard';

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
 * page. Repeat visits and reduced-motion are handled by `introGuardScript` in
 * `./intro-guard`, which runs before first paint — deciding that in an effect
 * would show the curtain for a frame before removing it, which is worse than not
 * having one. That script lives in its own file, outside this client module, for
 * a reason explained there.
 */
export function EntrySequence() {
  const [visible, setVisible] = useState(true);
  const { profile } = useT(profileContent);

  useEffect(() => {
    const root = document.documentElement;

    /*
      Normally the pre-paint guard has already decided, and this only reads its
      answer. The guard is an inline script, though, and inline scripts run only
      when they arrive in the server's HTML — a 404 is drawn entirely by the
      client, so there it never ran. Asking the same question again covers that
      case; on every other page the two answers are identical.
    */
    if (root.dataset.intro !== 'skip' && shouldSkipIntro()) root.dataset.intro = 'skip';

    // CSS has the curtain hidden. Unmount on the next frame purely to get it out
    // of the DOM — doing it synchronously here would just cost an extra render.
    if (root.dataset.intro === 'skip') {
      const frame = requestAnimationFrame(() => setVisible(false));
      return () => cancelAnimationFrame(frame);
    }

    let done = false;
    const dismiss = () => {
      if (done) return;
      done = true;
      setVisible(false);
      markIntroSeen();
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
