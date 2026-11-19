import type { Metadata } from 'next';
import { pitchDict } from '@/i18n/dictionaries/pitch';
import { getLocale, localizedAlternates } from '@/i18n/server';
import { PitchClient } from './PitchClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = pitchDict[locale].meta;

  return {
    title: t.title,
    description: t.description,
    alternates: localizedAlternates(locale, '/pitch'),
  };
}

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
