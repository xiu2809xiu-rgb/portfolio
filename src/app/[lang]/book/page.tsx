import type { Metadata } from 'next';
import { CalendarClock, ShieldCheck, Zap } from 'lucide-react';
import { BookingFlow } from '@/components/booking/BookingFlow';
import type { PolicyConfig } from '@/components/booking/types';
import { profileContent } from '@/content/localized/profile';
import type { Locale } from '@/i18n/config';
import { bookingDict } from '@/i18n/dictionaries/booking';
import { getLocale, localizedAlternates } from '@/i18n/server';
import { Container } from '@/infrastructure/Container';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = bookingDict[locale].meta;

  return {
    title: t.title,
    description: t.description,
    alternates: localizedAlternates(locale, '/book'),
  };
}

// Availability is live data; never prerender this page.
export const dynamic = 'force-dynamic';

/*
  Everything this page promises is conditional on the calendar adapter being the
  real one. With the Google credentials absent the site falls back to demo
  availability, and "the invite is created the moment you submit" becomes a
  straightforward untruth — the worst possible copy to show a recruiter. Both the
  subheading and the assurance card are derived from `calendar.isLive` so the page
  can only ever promise what the running configuration can actually deliver.
*/
const assurancesFor = (live: boolean, t: (typeof bookingDict)[Locale]['page']['assurances']) => [
  { icon: Zap, ...(live ? t.held : t.byEmail) },
  { icon: ShieldCheck, ...t.freeBusy },
  { icon: CalendarClock, ...t.timezone },
];

export default async function BookPage() {
  const locale = await getLocale();
  const t = bookingDict[locale].page;
  const { profile } = profileContent[locale];
  const container = Container.resolve();
  const config = container.policy.toClientConfig() as PolicyConfig;
  const live = container.calendar.isLive;
  const assurances = assurancesFor(live, t.assurances);

  return (
    <div className="wrap pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">~/{profile.shortName.toLowerCase()}/schedule</p>
        <h1 className="mt-4 font-heading text-[clamp(2.25rem,7vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          {t.heading((text) => (
            <span className="text-gradient-lime">{text}</span>
          ))}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          {t.lede(live)}
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-5xl">
        <BookingFlow initialConfig={config} calendarLive={container.calendar.isLive} />
      </div>

      <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3">
        {assurances.map((item) => (
          <li key={item.title} className="glass rounded-2xl p-5">
            <item.icon className="mb-3 size-5 text-lime" />
            <h2 className="font-heading text-sm font-bold">{item.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </li>
        ))}
      </ul>

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
        {t.emailInstead(
          <a href={`mailto:${profile.email}`} className="link-underline text-foreground">
            {profile.email}
          </a>,
        )}
      </p>
    </div>
  );
}
