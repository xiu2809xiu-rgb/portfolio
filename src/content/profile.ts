import type { Profile } from './types';

export const profile: Profile = {
  fullName: 'Richie Koh',
  shortName: 'Richie',
  legalName: 'Koh Shan Shun, Richie',
  role: 'Junior Software Developer',
  tagline: 'Full-stack developer and UX designer.',
  location: 'Singapore',
  timezone: 'Asia/Singapore',
  email: '251651x@mymail.nyp.edu.sg',
  photo: '/img/people/richie.jpg',
  resume: '/docs/Resume_Richie_Koh.pdf',
  bio: [
    'I build the whole thing — the interface, the API behind it, and the research that decides what either should do. Diploma in Information Technology at Nanyang Polytechnic, specialising in Full-Stack Development and Digital UX Design.',
    'On CertAIn I ran a moderated usability study with nine participants. Five of them were blocked by a map popup covering the route they needed — a defect none of us had noticed while building it, because we already knew where the route was. That is the argument for testing with strangers, and it is why I now treat a study as part of building rather than a step after it.',
    'Most recently: first place at the NYP × AWS Hackathon 2026, building the entire frontend of SmartRecap in one overnight sitting. I am looking for a 2027 software engineering internship in Singapore.',
  ],
  facts: [
    { label: 'Education', value: 'Dip. in IT — NYP' },
    { label: 'Focus Area', value: 'Full-Stack Development & Digital UX Design' },
    { label: 'Graduation', value: '2028' },
    { label: 'Languages', value: 'English & Mandarin' },
  ],
  exploring: ['React', 'Next.js', 'Retrieval-grounded interfaces', 'Design systems'],
  socials: [
    { label: 'Email', href: 'mailto:251651x@mymail.nyp.edu.sg', icon: 'mail' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/richiekoh2809/', external: true, icon: 'linkedin' },
    { label: 'GitHub', href: 'https://github.com/Richie280907', external: true, icon: 'github' },
  ],
};

/**
 * Thought bubbles that appear above the 3D avatar's head.
 *
 * Keep them short — the bubble is anchored to a moving head, so anything past
 * roughly six words wraps to three lines and starts covering the model. Written
 * in first person, because it is the avatar saying them.
 */
export const avatarThoughts = [
  'Open to 2027 internships 👀',
  'Ask me about SmartRecap',
  '1st place, NYP × AWS 2026',
  'This site is open source',
  'Drag the badge below ↓',
  'Built this from scratch',
] as const;

/**
 * Cycles inside the hero sub-line.
 *
 * The two halves of the same specialisation rather than adjectives, so the
 * sentence stays true on every frame.
 */
export const heroRotation = ['Full-Stack Development', 'Digital UX Design'] as const;

/** Marquee strip under the hero. Drawn from what the case studies actually use. */
export const marqueeTerms = [
  'REACT', 'NEXT.JS', 'TYPESCRIPT', 'PYTHON', 'FLASK', 'NODE.JS',
  'TAILWIND', 'POSTGRESQL', 'SQLITE', 'FIGMA', 'USABILITY TESTING', 'WEBGL', 'AWS',
] as const;

/**
 * Headline numbers on the home page.
 *
 * Counted against the current content, not carried forward: five case studies in
 * `projects.ts`, the distinct technologies listed across their stacks, and the
 * awards and certifications in `resume.ts`.
 */
export const headlineStats = [
  { value: 5, suffix: '', label: 'Shipped projects' },
  { value: 20, suffix: '+', label: 'Technologies used' },
  { value: 6, suffix: '', label: 'Awards & certifications' },
  { value: 2028, suffix: '', label: 'Graduating' },
] as const;
