import type { Locale } from '@/i18n/config';
import * as en from '../projects';
import * as zh from '../zh/projects';

/** `projects.ts` in both languages. See `localized/profile.ts` for the pattern. */
export const projectsContent: Record<Locale, typeof en> = { en, zh };
