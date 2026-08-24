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

const ASSURANCES = [
  {
    icon: Zap,
    title: 'Confirmed instantly',
    body: 'No back-and-forth. Pick a slot and the invite is created the moment you submit.',
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

  return (
    <div className="wrap pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">~/{profile.shortName.toLowerCase()}/schedule</p>
        <h1 className="mt-4 font-heading text-[clamp(2.25rem,7vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          Let&rsquo;s find <span className="text-gradient-lime">a time</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          Internships, project questions, a code review, or just a conversation about building
          things. Pick a length, pick a slot, and you&rsquo;ll get a calendar invite by email.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-5xl">
        <BookingFlow initialConfig={config} calendarLive={container.calendar.isLive} />
      </div>

      <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3">
        {ASSURANCES.map((item) => (
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
