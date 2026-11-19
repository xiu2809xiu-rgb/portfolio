import type { Locale } from '@/i18n/config';
import * as en from '../profile';
import * as zh from '../zh/profile';

/**
 * `profile.ts` in both languages.
 *
 * Typed as `typeof en`, so the Chinese module has to export every name the
 * English one does, with a compatible shape — a field added to one and
 * forgotten in the other is a compile error rather than a blank on the page.
 *
 *   const { profile, heroRotation } = useT(profileContent);        // client
 *   const { profile } = await getT(profileContent);                // server
 */
export const profileContent: Record<Locale, typeof en> = { en, zh };
