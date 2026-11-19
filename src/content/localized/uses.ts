import type { Locale } from '@/i18n/config';
import * as en from '../uses';
import * as zh from '../zh/uses';

/** `uses.ts` in both languages. See `localized/profile.ts` for the pattern. */
export const usesContent: Record<Locale, typeof en> = { en, zh };
