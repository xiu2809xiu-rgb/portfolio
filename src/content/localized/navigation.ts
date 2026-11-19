import type { Locale } from '@/i18n/config';
import * as en from '../navigation';
import * as zh from '../zh/navigation';

/** `navigation.ts` in both languages. See `localized/profile.ts` for the pattern. */
export const navigationContent: Record<Locale, typeof en> = { en, zh };
