import type { Achievement, ExperienceEntry, ProcessStep, SkillGroup, Testimonial } from './types';

/**
 * Technologies, grouped.
 *
 * No proficiency ratings. A self-assessed percentage is unverifiable, invites
 * an argument in an interview, and needs a disclaimer that concedes the point —
 * so the list says what has been used and leaves the judging to the case studies.
 */
export const skillGroups: readonly SkillGroup[] = [
  {
    name: 'Languages',
    icon: '⌨️',
    blurb: 'What I reach for first.',
    items: ['Python', 'JavaScript', 'TypeScript', 'SQL'],
  },
  {
    name: 'Frontend',
    icon: '🌐',
    blurb: 'The part people actually touch.',
    items: [
      'React',
      'Next.js',
      'Three.js / WebGL',
      'HTML5',
      'CSS3',
      'Tailwind CSS',
      'Material UI',
      'Bootstrap',
      'Figma',
    ],
  },
  {
    name: 'Backend',
    icon: '⚙️',
    blurb: 'Routing, auth, and the data behind it.',
    items: [
      'Node.js',
      'Express',
      'Flask',
      'FastAPI',
      'Sequelize',
      'SQLAlchemy',
      'REST APIs',
      'Session & token auth',
    ],
  },
  {
    name: 'Data',
    icon: '🗄️',
    blurb: 'Schemas, queries, and storage.',
    items: ['MySQL', 'PostgreSQL', 'SQLite', 'MongoDB', 'Oracle APEX', 'Schema design', 'Normalisation'],
  },
  {
    name: 'Cloud & DevOps',
    icon: '☁️',
    blurb: 'How the work gets shipped.',
    items: [
      'AWS (EC2, S3, RDS, CloudFront, IAM)',
      'Azure App Service',
      'Vercel',
      'Docker',
      'Git',
      'GitLab CI/CD',
      'Agile & Scrum',
      'User stories',
    ],
  },
  {
    name: 'Testing & research',
    icon: '🧪',
    blurb: 'Checking the work — with tools, and with people.',
    items: [
      'PyTest',
      'Selenium',
      'Postman / Newman',
      'OWASP Top 10',
      'Test planning',
      'Usability testing',
      'Journey mapping',
      'Personas',
      'Hypothesis testing',
    ],
  },
];

export const experience: readonly ExperienceEntry[] = [
  {
    period: '2025 — 2028',
    title: 'Diploma in Information Technology',
    organisation: 'Nanyang Polytechnic',
    description:
      'Specialising in Full-Stack Development and Digital UX Design. Director’s List for Semester 1 of AY2026/27, with a semester GPA of 4.0 and distinctions in Data Structures & Algorithms and Business Innovation & Enterprise.',
    coursework: [
      'Full Stack Application Development',
      'Digital User Experience Design',
      'Agile Development Process with DevOps',
      'Data Structures & Algorithms',
      'Cloud Computing',
      'Database Design & Administration',
      'Statistical Research Methods',
      'Cybersecurity Technologies & Ethics',
    ],
  },
  {
    period: '2025 — 2026',
    title: 'Private Tutor — Mathematics & Chinese',
    organisation: 'Self-sourced assignments, Singapore',
    description:
      'Taught 10+ students of varying ability, planning lessons around each student’s weakest topics rather than a fixed syllabus. The habit of checking whether an explanation actually landed — rather than assuming it did — is the same one that makes usability testing work.',
  },
  {
    period: '2025 — 2026',
    title: 'Assistant Class Representative',
    organisation: 'Nanyang Polytechnic, School of IT',
    description:
      'Elected by peers. Coordinated communications and resolved issues between 30+ classmates and lecturers.',
  },
  {
    period: '2025 — 2026',
    title: 'Overseas Education & Learning Programme (OELP-ACI)',
    organisation: 'Nanyang Polytechnic',
    description: 'Completed NYP’s overseas education and learning programme to ASEAN, China and India.',
  },
];

/** Secondary-school entries, kept as a single line rather than full entries. */
export const earlierExperience: string =
  'Earlier: Robotics Club executive committee at Riverside Secondary School — Scratch, breadboards and LEGO Mindstorms, including a First LEGO League participation award.';

/**
 * How the work actually goes, with a real instance attached to each step.
 *
 * Replaces the textbook Design Thinking loop. A named process that anyone could
 * recite says nothing; the same five steps with evidence underneath them say
 * what changed because the step happened.
 */
export const processSteps: readonly ProcessStep[] = [
  {
    index: '01',
    icon: '🔍',
    title: 'Research',
    body: 'Find out what the people using it actually do, and what the constraints really are — before anything gets designed around a guess.',
    evidence:
      'CertAIn was built offline-first because event venues are exactly where connectivity fails. That was a constraint discovered up front, not a feature added later.',
  },
  {
    index: '02',
    icon: '✏️',
    title: 'Design',
    body: 'Wireframes and a hi-fi prototype first. It is far cheaper to move a button in Figma than to move it after three screens depend on where it was.',
    evidence:
      'The CertAIn hi-fi prototype existed in Figma before the flows were tested, which is what made testing possible at all.',
  },
  {
    index: '03',
    icon: '🔧',
    title: 'Build',
    body: 'Working software, scoped to what the deadline actually allows. Choosing what not to build is part of building.',
    evidence:
      'SmartRecap: 25 page components, a citation reader, a 3D pipeline guide and session handling, in one overnight sitting after we misread the schedule.',
  },
  {
    index: '04',
    icon: '🧪',
    title: 'Test',
    body: 'With strangers, thinking aloud. You cannot see your own interface clearly, because you already know where everything is.',
    evidence:
      'Nine participants, three scenarios, mean SUS 74.2 — and a map popup covering the route that blocked five of them, which none of us had noticed while building it.',
  },
  {
    index: '05',
    icon: '🚀',
    title: 'Ship',
    body: 'Get it in front of people and say plainly what state it is in. A demo with an honest caveat is worth more than one that quietly fails.',
    evidence:
      'The SmartRecap demo runs on free tiers now that the hackathon AWS environment has expired, and the case study says so rather than letting the first slow load speak for it.',
  },
];

export const achievements: readonly Achievement[] = [
  {
    icon: '🥇',
    featured: true,
    title: '1st Place — NYP × AWS Hackathon',
    organisation: 'Nanyang Polytechnic × AWS',
    year: '2026',
    body: 'Problem Statement 1, Automated Class Recap Generator. Built SmartRecap with Stay Grounded, a team of four; as frontend lead I built the frontend in full, in a single overnight sitting.',
  },
  {
    icon: '📜',
    title: 'Director’s List',
    organisation: 'Nanyang Polytechnic',
    year: '2026',
    body: 'Semester 1, AY2026/27 — a semester GPA of 4.0, with distinctions in Data Structures & Algorithms and Business Innovation & Enterprise.',
  },
  {
    icon: '🤖',
    title: 'Python Hackathon — RGB Face Filter',
    organisation: 'SenseTime',
    year: '2022',
    body: 'Hands-on computer vision: an RGB face filter, built in Python.',
  },
  {
    icon: '🧩',
    title: 'AI Fluency: Framework & Foundation',
    organisation: 'Anthropic',
    body: 'Frameworks for responsible AI development and practical applications in modern software.',
  },
  {
    icon: '🎨',
    title: 'UX Design Fundamentals',
    organisation: 'IBM',
    body: 'Research, wireframing and evaluation as a discipline rather than a stage.',
  },
  {
    icon: '🌐',
    title: 'Web Development Basics (MDLPT-268)',
    organisation: 'IBM',
    body: 'HTML, CSS, JavaScript, and modern development workflows.',
  },
  {
    icon: '🎓',
    title: 'Assistant Class Representative',
    organisation: 'Nanyang Polytechnic',
    body: 'Elected by peers to coordinate communications between 30+ classmates and lecturers.',
  },
  {
    icon: '🏅',
    title: 'Hackathon — 4th Place',
    organisation: 'School-wide competition',
    body: 'Built a working prototype under tight time constraints.',
    minor: true,
  },
];

/**
 * One real testimonial rather than two padded ones.
 *
 * A self-written quote attributed to "personal reflection" reads as filler in a
 * section whose whole purpose is third-party corroboration — better short.
 */
export const testimonials: readonly Testimonial[] = [
  {
    quote:
      'Richie consistently demonstrates strong attention to detail and a genuine willingness to help his teammates. His ticketing system was one of the most polished in our cohort.',
    name: 'Rihan Iqbal',
    title: 'Teammate — Singink, and SmartRecap at NYP × AWS 2026',
    avatar: '/img/people/rihan.jpg',
  },
];
