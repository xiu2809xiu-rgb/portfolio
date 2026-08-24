import type { Achievement, ExperienceEntry, ProcessStep, SkillGroup, Testimonial } from './types';

export const skillGroups: readonly SkillGroup[] = [
  {
    name: 'Languages',
    icon: '⌨️',
    blurb: 'What I reach for first.',
    items: ['Python', 'JavaScript', 'TypeScript', 'SQL'],
    levels: [
      { name: 'Python', value: 85 },
      { name: 'JavaScript', value: 70 },
      { name: 'SQL', value: 85 },
    ],
  },
  {
    name: 'Web',
    icon: '🌐',
    blurb: 'Markup, styling, and the browser.',
    items: ['HTML5', 'CSS3', 'Bootstrap 5', 'Tailwind CSS'],
    levels: [
      { name: 'HTML5', value: 90 },
      { name: 'CSS3', value: 85 },
      { name: 'Bootstrap', value: 80 },
    ],
  },
  {
    name: 'Frameworks',
    icon: '⚙️',
    blurb: 'Server-side and component models.',
    items: ['Flask', 'Jinja2', 'SQLAlchemy', 'React', 'Next.js'],
    levels: [
      { name: 'Flask', value: 80 },
      { name: 'SQLAlchemy', value: 75 },
      { name: 'React', value: 60 },
    ],
  },
  {
    name: 'Data',
    icon: '🗄️',
    blurb: 'Schemas, queries, and storage.',
    items: ['MySQL', 'Oracle', 'SQLite', 'PostgreSQL'],
    levels: [
      { name: 'MySQL', value: 80 },
      { name: 'Schema design', value: 75 },
    ],
  },
  {
    name: 'Practices',
    icon: '🛠️',
    blurb: 'How I keep code maintainable.',
    items: ['CRUD design', 'REST APIs', 'Schema design', 'MVC pattern', 'Design Thinking'],
  },
  {
    name: 'Working with people',
    icon: '🤝',
    blurb: 'The half that is not code.',
    items: ['Teamwork', 'Communication', 'Detail-oriented', 'Problem solving', 'Time management'],
  },
];

export const experience: readonly ExperienceEntry[] = [
  {
    period: '2025 — 2028',
    title: 'Diploma in Information Technology',
    organisation: 'Nanyang Polytechnic',
    description:
      'Building a foundation in web development, UX design, database systems, AI analytics, cybersecurity, and software engineering practices.',
    coursework: [
      'Web Development Project',
      'UX Design in Web Dev',
      'Database Design',
      'Programming',
      'AI & Data Analytics',
      'Cybersecurity',
      'Network Technology',
      'Business Innovation',
    ],
  },
  {
    period: '2025 — 2026',
    title: 'Part-Time Tutor',
    organisation: 'Private / ad-hoc',
    description:
      'Taught Primary Chinese and Mathematics to 10+ students of varying abilities with adapted teaching methods. Developed communication, patience, and responsibility — the same skills that make technical collaboration work.',
  },
  {
    period: '2025 — Present',
    title: 'Class Vice Representative',
    organisation: 'Nanyang Polytechnic',
    description:
      'Coordinated communications and resolved issues for 30+ classmates and lecturers. Demonstrated reliability, teamwork, and ownership in group settings.',
  },
  {
    period: 'Secondary',
    title: 'Robotics Club — Executive Committee',
    organisation: 'Riverside Secondary School',
    description:
      'Led junior members during training and helped plan club events. Hands-on with Scratch, breadboards, and LEGO Mindstorms. First LEGO League participation award and a 4th place hackathon finish.',
  },
];

export const processSteps: readonly ProcessStep[] = [
  {
    index: '01',
    icon: '🧠',
    title: 'Empathize',
    body: 'Understand real user needs through research, interviews, and observation. Walk in the user’s shoes before proposing anything.',
  },
  {
    index: '02',
    icon: '🎯',
    title: 'Define',
    body: 'Synthesise findings into clear problem statements. Identify the core challenge and the business constraints around it.',
  },
  {
    index: '03',
    icon: '💡',
    title: 'Ideate',
    body: 'Brainstorm broadly, then narrow. Sketch wireframes and map user flows before a single component is written.',
  },
  {
    index: '04',
    icon: '🔧',
    title: 'Prototype',
    body: 'Build something real and quickly. Working software beats a deck — it exposes the assumptions that were wrong.',
  },
  {
    index: '05',
    icon: '✅',
    title: 'Test',
    body: 'Validate with actual users, gather feedback, fix the edge cases, and refine until the solution genuinely works.',
  },
];

export const achievements: readonly Achievement[] = [
  {
    icon: '🏆',
    title: 'Hackathon — 4th Place',
    organisation: 'School-wide competition',
    body: 'Built a working prototype under tight time constraints, placing 4th against the full cohort.',
  },
  {
    icon: '🤖',
    title: 'First LEGO League — Participation Award',
    organisation: 'Robotics Club',
    body: 'Built and programmed autonomous robots. Early exposure to engineering design under a competition deadline.',
  },
  {
    icon: '💻',
    title: 'Web Development Project',
    organisation: 'Nanyang Polytechnic — IT1x25',
    body: 'Delivered a fully functional customer ticketing system with CRUD, an admin dashboard, and field validation.',
  },
  {
    icon: '🎓',
    title: 'Class Vice Representative',
    organisation: 'Nanyang Polytechnic',
    body: 'Elected by peers to support class coordination — leadership, responsibility, and communication in practice.',
  },
  {
    icon: '🧩',
    title: 'AI Fluency: Framework & Foundation',
    organisation: 'Anthropic',
    body: 'Certified in AI fundamentals — frameworks for responsible AI development and practical applications in modern software.',
  },
  {
    icon: '🌐',
    title: 'Web Development Basics (MDLPT-268)',
    organisation: 'IBM',
    body: 'Certified in web fundamentals covering HTML, CSS, JavaScript, and modern development workflows.',
  },
  {
    icon: '🐍',
    title: 'Python Hackathon — RGB Face Filter',
    organisation: 'Industry-run hackathon',
    body: 'Built an RGB face filter with Python and computer vision libraries during an intensive hackathon.',
  },
];

export const testimonials: readonly Testimonial[] = [
  {
    quote:
      'Richie consistently demonstrates strong attention to detail and a genuine willingness to help his teammates. His ticketing system was one of the most polished in our cohort.',
    name: 'Rihan Iqbal',
    title: 'WDP project teammate',
    avatar: '/img/people/rihan.jpg',
  },
  {
    quote:
      'Lecturers consistently commend my attention to detail and proactive attitude. Their feedback fuels my commitment to delivering high-quality work in every project I undertake.',
    name: 'Personal reflection',
    title: 'Based on lecturer feedback',
    emoji: '📝',
  },
];
