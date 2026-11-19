import type { Metadata } from 'next';
import { driveDict } from '@/i18n/dictionaries/drive';
import { getLocale, localizedAlternates } from '@/i18n/server';
import { DriveClient } from './DriveClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = driveDict[locale].meta;

  return {
    title: t.title,
    description: t.description,
    alternates: localizedAlternates(locale, '/drive'),
    /*
      Not indexable while the vehicle physics is unfinished. The route works and is
      linked from nowhere, but a search engine finding a half-built toy on a
      portfolio being read by recruiters is a bad trade. Remove once it drives.
    */
    robots: { index: false, follow: false },
  };
}

/**
 * The playground route.
 *
 * Its own page rather than a section on the home page, and every byte of it is
 * behind a dynamic import. A physics engine and a renderer are a large thing to
 * hand someone who came to read a CV; here, only the people who want to drive
 * pay for it.
 */
export default function DrivePage() {
  return <DriveClient />;
}
