import type { Locale } from '@/i18n/config';
import * as en from '../reboot';
import * as zh from '../zh/reboot';

/** `reboot.ts` in both languages. See `localized/profile.ts` for the pattern. */
export const rebootContent: Record<Locale, typeof en> = { en, zh };
