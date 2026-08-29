import type { Metadata } from 'next';
import { CalendarClock, ShieldCheck, Zap } from 'lucide-react';
import { BookingFlow } from '@/components/booking/BookingFlow';
import type { PolicyConfig } from '@/components/booking/types';
import { profile } from '@/content/profile';
import { Container } from '@/infrastructure/Container';

export const metadata: Metadata = {
  title: 'Book a session',
  description:
    'Pick a 15, 30, 45, or 60 minute slot on my calendar. Only my free/busy is shown — never what I am actually doing.',
  alternates: { canonical: '/book' },
};

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
const assurancesFor = (live: boolean) => [
  live
    ? {
        icon: Zap,
        title: 'Held while I answer',
        body: 'Your slot is reserved the moment you submit, and I confirm it myself — usually the same day.',
      }
    : {
        icon: Zap,
        title: 'Confirmed by email',
        body: 'The calendar is in demo mode right now, so I confirm each request by email myself.',
      },
  {
    icon: ShieldCheck,
    title: 'Free/busy only',
    body: 'The grid shows whether I am free — never event titles, guests, or what I am doing.',
  },
  {
    icon: CalendarClock,
    title: 'Your timezone',
    body: 'Every slot is shown in my time and yours, so nobody does mental arithmetic.',
  },
];

export default function BookPage() {
  const container = Container.resolve();
  const config = container.policy.toClientConfig() as PolicyConfig;
  const live = container.calendar.isLive;
  const assurances = assurancesFor(live);

  return (
    <div className="wrap pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">~/{profile.shortName.toLowerCase()}/schedule</p>
        <h1 className="mt-4 font-heading text-[clamp(2.25rem,7vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          Let&rsquo;s find <span className="text-gradient-lime">a time</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          Internships, project questions, a code review, or just a conversation about building
          things.{' '}
          {live
            ? "Pick a length and a slot. It is held for you straight away, and I’ll confirm it myself — you’ll hear back either way."
            : "Pick a length and a slot — this calendar is in demo mode at the moment, so I’ll confirm by email."}
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
        Prefer email? Reach me at{' '}
        <a href={`mailto:${profile.email}`} className="link-underline text-foreground">
          {profile.email}
        </a>
        .
      </p>
    </div>
  );
}
