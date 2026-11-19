import type { Metadata } from 'next';
import { PitchClient } from './PitchClient';

export const metadata: Metadata = {
  title: 'The pitch',
  description:
    'One slider, fifty positions, from "what of it?" to a page actively shouting. Every claim on it is true; only the volume changes.',
  alternates: { canonical: '/pitch' },
};

/**
 * A joke with a real CV inside it.
 *
 * Its own route rather than a section, for the same reason the driving page is:
 * someone arriving to read a portfolio should meet the portfolio. This is for
 * the people who go looking.
 */
export default function PitchPage() {
  return <PitchClient />;
}
