import type { Locale } from '@/i18n/config';
import * as en from '../resume';
import * as zh from '../zh/resume';

/** `resume.ts` in both languages. See `localized/profile.ts` for the pattern. */
export const resumeContent: Record<Locale, typeof en> = { en, zh };
