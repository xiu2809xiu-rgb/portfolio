'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Distance travelled during the reveal, in pixels. */
  distance?: number;
  as?: 'div' | 'li' | 'section' | 'article';
}

/**
 * Scroll-triggered entrance used across the site.
 *
 * `whileInView` with `once` so a section animates the first time it is reached
 * and then stays put — re-animating on every scroll-back is the thing that makes
 * portfolio sites feel restless. Collapses to a plain fade when the visitor has
 * asked for reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  distance = 24,
  as = 'div',
}: RevealProps) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as];

  const variants: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduced ? 0.2 : 0.7,
        delay: reduced ? 0 : delay,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}
