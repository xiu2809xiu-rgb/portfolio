import type { UsesCategory } from './types';

export const usesIntro =
  'The tools I actually open every day — not an aspirational list. Updated whenever something earns or loses its place.';

export const usesCategories: readonly UsesCategory[] = [
  {
    name: 'Editor & terminal',
    icon: '⌨️',
    entries: [
      { name: 'Visual Studio Code', note: 'Main editor. Dark+ theme, Fira Code with ligatures on.' },
      { name: 'Claude Code', note: 'Pair programmer in the terminal for refactors and scaffolding.' },
      { name: 'Windows Terminal + Git Bash', note: 'POSIX habits on a Windows machine.' },
      { name: 'GitHub Desktop', note: 'For reviewing diffs visually before I commit.' },
    ],
  },
  {
    name: 'Languages & frameworks',
    icon: '🧰',
    entries: [
      { name: 'Python + Flask', note: 'Where I am most fluent. Blueprints, SQLAlchemy, Jinja2.' },
      { name: 'TypeScript + Next.js', note: 'What this site is built on. Learning it properly in 2026.' },
      { name: 'Tailwind CSS', note: 'Design tokens in one place, no stylesheet archaeology.' },
      { name: 'PostgreSQL / MySQL', note: 'Relational by default. I reach for a schema before a document store.' },
    ],
  },
  {
    name: 'Design & planning',
    icon: '🎨',
    entries: [
      { name: 'Figma', note: 'Wireframes and component sketches before any code.' },
      { name: 'Excalidraw', note: 'Whiteboarding architecture and data flow.' },
      { name: 'Notion', note: 'Module notes, project briefs, and a running reading list.' },
    ],
  },
  {
    name: 'Hardware',
    icon: '🖥️',
    entries: [
      { name: 'Windows 11 laptop', note: 'Daily driver for coursework and side projects.' },
      { name: 'External 1080p monitor', note: 'Editor on the laptop, browser and docs on the second screen.' },
      { name: 'Wired earbuds', note: 'No pairing, no battery, no excuses.' },
    ],
  },
  {
    name: 'Shortcuts worth stealing',
    icon: '⚡',
    entries: [
      { name: 'Ctrl + P', note: 'Fuzzy file open. I almost never use the file tree.' },
      { name: 'Ctrl + Shift + L', note: 'Select every occurrence and edit them at once.' },
      { name: 'Alt + ↑ / ↓', note: 'Move a line without cutting and pasting it.' },
      { name: 'F2', note: 'Rename symbol across the whole project safely.' },
    ],
  },
];
