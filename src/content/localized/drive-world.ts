import type { Locale } from '@/i18n/config';
import * as en from '../drive-world';
import * as zh from '../zh/drive-world';

/**
 * `drive-world.ts` in both languages. See `localized/profile.ts` for the pattern.
 *
 * For whatever prints a district's name or blurb. The 3D components want the
 * geometry and the in-world signage, which is the same in both languages, and
 * import `@/content/drive-world` directly.
 */
export const driveWorldContent: Record<Locale, typeof en> = { en, zh };
