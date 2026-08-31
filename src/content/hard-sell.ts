/**
 * Fifty escalating pitches, from deadpan to unhinged.
 *
 * The joke only works if the facts underneath it are true, so every claim here
 * appears somewhere else on this site: the hackathon placing, the SUS score, the
 * participant counts, the build window. The volume rises; the substance does not
 * inflate. A line that lied would stop being funny and start being a liability
 * in front of the exact people this page is aimed at.
 *
 * Lines are segments rather than strings so a phrase can carry a link. The rule
 * is that a link only ever names the thing it points at — "the hackathon" goes to
 * the hackathon project, not to a contact form — because a reader who follows one
 * and lands somewhere unrelated will not follow a second.
 */
export type Segment = string | { readonly text: string; readonly href: string };
export type SellLine = readonly Segment[];

const to = (text: string, href: string): Segment => ({ text, href });

export const hardSellLines: readonly SellLine[] = [
  // ── 1–8 · deadpan ────────────────────────────────────────────────────────
  ['So, yeah, I write software. What of it?'],
  ['Richie. Full-stack. Singapore. That is the entire pitch.'],
  ['I build things for the web. You may carry on with your day.'],
  ['There is a ', to('portfolio', '/work'), '. It is right there. No pressure.'],
  ['I am a software developer. Some of the software works.'],
  ['Available for a 2027 internship, if that is a thing you need.'],
  ['Not going to oversell this. The ', to('work', '/work'), ' is a click away.'],
  ['Diploma in IT at Nanyang Polytechnic. Out in 2028.'],

  // ── 9–16 · mildly self-aware ─────────────────────────────────────────────
  ['I should probably mention I won something recently.'],
  ['First place at the ', to('NYP × AWS Hackathon 2026', '/work/smartrecap'), '. Casually dropped.'],
  ['Five ', to('shipped projects', '/work'), '. I counted them twice to be sure.'],
  ['Front-end, back-end, and the ', to('UX decisions', '/#skills'), ' in between.'],
  ['I once built twenty-five page components in one night. On purpose.'],
  ['The ', to('overnight one', '/work/smartrecap'), ' placed first, if we are keeping score.'],
  ['We are keeping score.'],
  ['Twenty-plus technologies. Six ', to('awards and certifications', '/#achievements'), '. Still counting.'],

  // ── 17–24 · actually selling now ─────────────────────────────────────────
  ['Let me be direct: I would be good at this.'],
  [to('SmartRecap', '/work/smartrecap'), ' cites the exact slide behind every claim. That was the point.'],
  ['I built the entire client for it. Every component.'],
  [to('CertAIn', '/work/certain'), ' scored a mean SUS of 74.2 across nine participants.'],
  ['I ran that ', to('study', '/work/certain'), ' myself. Moderated, think-aloud, three scenarios.'],
  ['Five of nine users were blocked by a popup nobody on the team could see.'],
  ['Finding that is the job. Anyone can ship the happy path.'],
  ['Flask, React, TypeScript, Next, Postgres, three.js. ', to('Pick a stack', '/#skills'), '.'],

  // ── 25–32 · keen ─────────────────────────────────────────────────────────
  ['You are still reading. That is a strong signal for both of us.'],
  [
    'Twelve routes, six tables, fifteen validation rules — ',
    to('on the server', '/work/singink-support'),
    ', where they count.',
  ],
  ['This site books ', to('real meetings on a real calendar', '/book'), '. Try it.'],
  ['The ', to('car on this site', '/drive'), ' has working suspension. I could not help myself.'],
  ['I ', to('write about the things I get wrong', '/blog'), '. It is a short list. Allegedly.'],
  ['I would rather ship one honest feature than five that need explaining.'],
  ['Hire me and I will tell you when your idea is wrong. Politely.'],
  ['Interns who ask why are cheaper than engineers who fix it later.'],

  // ── 33–40 · infomercial ──────────────────────────────────────────────────
  ['AVAILABLE NOW. SINGAPORE. 2027 INTERNSHIP. SAY THE WORD.'],
  ['PROVEN TO ', to('WIN HACKATHONS', '/work/smartrecap'), '. PROVEN TO ', to('RUN STUDIES', '/work/certain'), '. PROVEN TO SHIP.'],
  ['ACT NOW AND RECEIVE A DEVELOPER WHO WRITES HIS OWN COMMIT MESSAGES.'],
  ['THAT IS RIGHT. FULL SENTENCES. IN THE PAST TENSE. EXPLAINING WHY.'],
  ['OTHER CANDIDATES WILL SEND A PDF. I SENT YOU ', to('A WHOLE WEBSITE', '/'), '.'],
  ['WITH A ', to('BOOKING SYSTEM', '/book'), '. AND A ', to('PHYSICS ENGINE', '/drive'), '. AND A ', to('BLOG', '/blog'), '.'],
  ['THE OTHER TEAM IS ALREADY READING THIS PAGE. PROBABLY.'],
  ['CAN YOU AFFORD TO FIND OUT? CAN YOU?'],

  // ── 41–46 · unhinged ─────────────────────────────────────────────────────
  ['BOOK THE MEETING. THE CALENDAR IS RIGHT THERE. IT IS FREE.'],
  ['I HAVE CLEARED MY SCHEDULE. ADMITTEDLY IT WAS ALREADY CLEAR.'],
  ['FIRST PLACE. NYP × AWS 2026. I AM GOING TO KEEP SAYING IT.'],
  ['SEVENTY-FOUR POINT TWO. THAT IS A REAL SUS SCORE. LOOK IT UP.'],
  ['TWENTY-FIVE COMPONENTS. ONE NIGHT. SIXTEEN AND A HALF HOURS.'],
  ['I DID NOT SLEEP AND WE WON AND I WOULD DO IT AGAIN.'],

  // ── 47–50 · total collapse ───────────────────────────────────────────────
  ['EMAIL ME. BOOK ME. THE BUTTONS ARE ENORMOUS NOW. I MADE THEM ENORMOUS.'],
  ['THE PROJECTS ARE FLYING PAST. THAT IS ALL REAL WORK. LOOK AT IT.'],
  ['HIRE RICHIE. HIRE RICHIE. HIRE RICHIE. HIRE RICHIE.'],
  ['HIRE RICHIE KOH'],
];

/** Flattened text, for the screen-reader value on the slider. */
export const lineText = (line: SellLine): string =>
  line.map((part) => (typeof part === 'string' ? part : part.text)).join('');

/** The five visual regimes the page moves through, keyed by slider level. */
export type SellStage = 'deadpan' | 'warming' | 'keen' | 'infomercial' | 'unhinged';

export function stageFor(level: number): SellStage {
  if (level <= 8) return 'deadpan';
  if (level <= 16) return 'warming';
  if (level <= 32) return 'keen';
  if (level <= 40) return 'infomercial';
  return 'unhinged';
}

/** Marquee content that scrolls past once things get loud. */
export const shoutingPoints: readonly string[] = [
  '1ST PLACE · NYP × AWS HACKATHON 2026',
  'MEAN SUS 74.2',
  '25 PAGE COMPONENTS IN 16.5 HOURS',
  'AVAILABLE FOR A 2027 INTERNSHIP',
  '5 SHIPPED PROJECTS',
  'FULL-STACK & UX',
  'SINGAPORE',
];

/**
 * Real work, thrown across the screen at the loud end.
 *
 * These are the same reels the work carousel plays. Using them here means the
 * chaos is made of the portfolio itself rather than of stock imagery — and it
 * costs nothing extra, because a visitor who has seen the home page already has
 * them cached.
 */
export const flyingWork: readonly { title: string; src: string; href: string }[] = [
  { title: 'SmartRecap', src: '/video/work/smartrecap.mp4', href: '/work/smartrecap' },
  { title: 'Singink', src: '/video/work/singink-support.mp4', href: '/work/singink-support' },
  {
    title: 'Table Tennis CCA',
    src: '/video/work/table-tennis-cca-website.mp4',
    href: '/work/table-tennis-cca-website',
  },
];
