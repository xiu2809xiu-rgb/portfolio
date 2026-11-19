import type { ReactNode } from 'react';
import type { Locale } from '../config';

/**
 * Strings for /uses that are not the list itself. The tools and the notes on
 * them are content: `src/content/uses.ts` and its Chinese twin.
 */

const en = {
  meta: {
    title: 'Uses',
    description: 'The editor, stack, hardware, and keyboard shortcuts I actually use every day.',
  },

  /** The page heading. `accent` wraps the words set in the lime gradient. */
  heading: (accent: (text: string) => ReactNode): ReactNode => (
    <>What I {accent('actually use')}</>
  ),
};

const zh: typeof en = {
  meta: {
    title: '工具',
    description: '我每天真正在用的编辑器、技术栈、硬件和键盘快捷键。',
  },

  heading: (accent) => <>我{accent('真正在用')}的工具</>,
};

export const usesDict: Record<Locale, typeof en> = { en, zh };
