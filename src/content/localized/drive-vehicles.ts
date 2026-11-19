import type { Locale } from '@/i18n/config';
import * as en from '../drive-vehicles';
import * as zh from '../zh/drive-vehicles';

/**
 * `drive-vehicles.ts` in both languages. See `localized/profile.ts` for the pattern.
 *
 * For the picker, which is the only place a car is described in words. Anything
 * that needs a body, a tune or an engine note reads `@/content/drive-vehicles`
 * directly — those are the same car in either language.
 */
export const driveVehiclesContent: Record<Locale, typeof en> = { en, zh };
