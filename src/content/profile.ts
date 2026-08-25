import type { Profile } from './types';

export const profile: Profile = {
  fullName: 'Richie Koh',
  shortName: 'Richie',
  legalName: 'Koh Shan Shun, Richie',
  role: 'Aspiring Junior Software Developer',
  tagline: 'I craft web experiences that matter.',
  location: 'Singapore',
  timezone: 'Asia/Singapore',
  email: '251651x@mymail.nyp.edu.sg',
  phone: '+65 8750 2535',
  photo: '/img/people/richie.jpg',
  resume: '/docs/Resume_Richie_Koh.pdf',
  motto: 'Build for people first, technology second.',
  bio: [
    "I'm Koh Shan Shun, Richie — a Diploma in Information Technology student at Nanyang Polytechnic, expected to graduate in 2028.",
    'My journey in tech is driven by a deep curiosity for how software can solve real-world problems. Through hands-on projects in web development and UX design, I have built functional applications using Python Flask, SQL databases, and Bootstrap — with a focus on clean code, meaningful user experiences, and sustainable design.',
    'I believe the best software is built with empathy — understanding the people who use it before writing a single line of code. I am eager to bring my skills, discipline, and passion for user-centric design to a team making tangible impact.',
  ],
  facts: [
    { label: 'Education', value: 'Dip. in IT — NYP' },
    { label: 'Focus Area', value: 'Web Development' },
    { label: 'Graduation', value: '2028' },
    { label: 'Languages', value: 'English & Mandarin' },
  ],
  exploring: ['AI & Machine Learning', 'React.js', 'Cloud Deployment', 'API Design'],
  socials: [
    { label: 'Email', href: 'mailto:251651x@mymail.nyp.edu.sg', icon: 'mail' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/richiekoh2809/', external: true, icon: 'linkedin' },
    { label: 'GitHub', href: 'https://github.com/Richie280907', external: true, icon: 'github' },
    { label: '+65 8750 2535', href: 'tel:+6587502535', icon: 'phone' },
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
  'Open to internships 👀',
  'Ask me about Flask',
  'Currently learning Three.js',
  'This site is open source',
  'Drag the badge below ↓',
  'Built this from scratch',
] as const;

/** Rotating words in the hero sub-headline. */
export const heroRotation = [
  'scalable solutions',
  'accessible interfaces',
  'honest software',
  'things people finish using',
] as const;

/** Marquee strip under the hero. */
export const marqueeTerms = [
  'PYTHON', 'FLASK', 'JAVASCRIPT', 'TYPESCRIPT', 'REACT', 'NEXT.JS',
  'HTML5', 'CSS3', 'TAILWIND', 'SQLALCHEMY', 'MYSQL', 'UX DESIGN', 'REST APIS',
] as const;

/** Headline numbers on the home page. */
export const headlineStats = [
  { value: 2, suffix: '', label: 'Shipped projects' },
  { value: 12, suffix: '+', label: 'Technologies used' },
  { value: 7, suffix: '', label: 'Certifications & awards' },
  { value: 2028, suffix: '', label: 'Graduating' },
] as const;
