'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStillness } from '@/lib/use-stillness';
import { cn } from '@/lib/utils';

interface RotatingWordProps {
  words: readonly string[];
  intervalMs?: number;
  className?: string;
}

/**
 * Cycles through a list of phrases in place.
 *
 * Rendered inline inside a sentence, so the wrapper is `inline-flex` with the
 * baseline preserved — a naive absolute-positioned swap makes the line jump. For
 * reduced-motion visitors it simply prints the first phrase and stops.
 */
export function RotatingWord({ words, intervalMs = 2600, className }: RotatingWordProps) {
  const reduced = useStillness();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || words.length <= 1) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % words.length), intervalMs);
    return () => clearInterval(timer);
  }, [words.length, intervalMs, reduced]);

  if (reduced) return <span className={className}>{words[0]}</span>;

  return (
    <span className={cn('relative inline-grid overflow-hidden align-bottom', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[index]}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="col-start-1 row-start-1 whitespace-nowrap"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
