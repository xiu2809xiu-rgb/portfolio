/**
 * Fifty escalating pitches, from deadpan to unhinged.
 *
 * The joke only works if the facts underneath it are true, so every claim here
 * appears somewhere else on this site: the hackathon placing, the SUS score, the
 * participant counts, the build window. The volume rises; the substance does not
 * inflate. A line that lied would stop being funny and start being a liability
 * in front of the exact people this page is aimed at.
 */
export const hardSellLines: readonly string[] = [
  // ── 1–8 · deadpan ────────────────────────────────────────────────────────
  'So, yeah, I write software. What of it?',
  'Richie. Full-stack. Singapore. That is the entire pitch.',
  'I build things for the web. You may carry on with your day.',
  'There is a portfolio. It is on this site. No pressure.',
  'I am a software developer. Some of the software works.',
  'Available for a 2027 internship, if that is a thing you need.',
  'Not going to oversell this. The work is a few clicks away.',
  'Diploma in IT at Nanyang Polytechnic. Out in 2028.',

  // ── 9–16 · mildly self-aware ─────────────────────────────────────────────
  'I should probably mention I won something recently.',
  'First place at the NYP × AWS Hackathon 2026. Casually dropped.',
  'Five shipped projects. I counted them twice to be sure.',
  'Front-end, back-end, and the UX decisions in between.',
  'I once built twenty-five page components in one night. On purpose.',
  'The overnight one placed first, if we are keeping score.',
  'We are keeping score.',
  'Twenty-plus technologies. Six awards and certifications. Still counting.',

  // ── 17–24 · actually selling now ─────────────────────────────────────────
  'Let me be direct: I would be good at this.',
  'SmartRecap cites the exact slide behind every claim. That was my call.',
  'I built the entire client for it. Every component.',
  'CertAIn scored a mean SUS of 74.2 across nine participants.',
  'I ran that study myself. Moderated, think-aloud, three scenarios.',
  'Five of nine users were blocked by a popup nobody on the team could see.',
  'Finding that is the job. Anyone can ship the happy path.',
  'Flask, React, TypeScript, Next, Postgres, three.js. Pick a stack.',

  // ── 25–32 · keen ─────────────────────────────────────────────────────────
  'You are still reading. That is a strong signal for both of us.',
  'Twelve Flask routes. Six tables. Fifteen validation rules. On the server, where they count.',
  'This site books real meetings on a real calendar. Try it.',
  'The car on this site has working suspension. I could not help myself.',
  'I read the docs. All of them. It is a problem.',
  'I would rather ship one honest feature than five that need explaining.',
  'Hire me and I will tell you when your idea is wrong. Politely.',
  'Interns who ask why are cheaper than engineers who fix it later.',

  // ── 33–40 · infomercial ──────────────────────────────────────────────────
  'AVAILABLE NOW. Singapore. 2027 internship. Say the word.',
  'PROVEN to win hackathons. PROVEN to run usability studies. PROVEN to ship.',
  'ACT NOW and receive a developer who writes his own commit messages.',
  'THAT IS RIGHT. Full sentences. In the past tense. Explaining WHY.',
  'OTHER CANDIDATES WILL SEND A PDF. I SENT YOU A WHOLE WEBSITE.',
  'WITH A BOOKING SYSTEM. AND A PHYSICS ENGINE. AND A BLOG.',
  'THE OTHER TEAM IS ALREADY READING THIS PAGE. PROBABLY.',
  'CAN YOU AFFORD TO FIND OUT? CAN YOU?',

  // ── 41–46 · unhinged ─────────────────────────────────────────────────────
  'BOOK THE MEETING. THE CALENDAR IS RIGHT THERE. IT IS FREE.',
  'I HAVE CLEARED MY SCHEDULE. ADMITTEDLY IT WAS ALREADY CLEAR.',
  'FIRST PLACE. NYP × AWS 2026. I AM GOING TO KEEP SAYING IT.',
  'SEVENTY-FOUR POINT TWO. THAT IS A REAL SUS SCORE. LOOK IT UP.',
  'TWENTY-FIVE COMPONENTS. ONE NIGHT. SIXTEEN AND A HALF HOURS.',
  'I DID NOT SLEEP AND WE WON AND I WOULD DO IT AGAIN.',

  // ── 47–50 · total collapse ───────────────────────────────────────────────
  'EMAIL ME. BOOK ME. THE BUTTONS ARE ENORMOUS NOW. I MADE THEM ENORMOUS.',
  'THERE IS A CAT ON THE PHONE. THE CAT IS ALSO ASKING YOU TO HIRE ME.',
  'HIRE RICHIE. HIRE RICHIE. HIRE RICHIE. HIRE RICHIE.',
  'HIRE RICHIE KOH',
];

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
