import type { Locale } from '@/i18n/config';
import * as en from '../hard-sell';
import * as zh from '../zh/hard-sell';

/** `hard-sell.ts` in both languages. See `localized/profile.ts` for the pattern. */
export const hardSellContent: Record<Locale, typeof en> = { en, zh };
