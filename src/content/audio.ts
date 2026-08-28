export interface Track {
  /** File under `public/audio/`. */
  readonly src: string;
  readonly title: string;
  readonly artist: string;
}

/**
 * Background music playlist.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TO ADD YOUR MUSIC
 *   1. Drop the files into `public/audio/`
 *   2. Add an entry below for each one
 *   3. That's it — the player picks them up automatically
 *
 * Prefer `.mp3` (universal) or `.m4a`. Keep each file under ~4 MB; the player
 * streams rather than preloads, but a phone on mobile data still pays for it.
 *
 * Filenames must be URL-safe — ASCII, no spaces, commas or punctuation like `•`.
 * Next serves /public over a real URL path, and a name with those characters
 * 404s even though the file is sitting right there. Put the real title in
 * `title` instead; that is what the player displays.
 *
 * A note worth knowing rather than finding out later: this site is public, so
 * anything here is being publicly performed. Music you did not create or license
 * can draw a takedown regardless of whether it is instrumental. Royalty-free
 * sources that are safe for this: incompetech.com, freemusicarchive.org (check
 * the per-track licence), or the YouTube Audio Library.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const playlist: readonly Track[] = [
  { src: '/audio/kong-shan-ye-ma.mp3', title: '空山 · 野马', artist: 'Bethybai & 岸炘' },
  { src: '/audio/broken-heart.mp3', title: 'Broken Heart', artist: 'Stjæler Mit Hjerte' },
];

/** Default music volume, 0–1. Deliberately low: it is a background, not a set. */
export const MUSIC_VOLUME = 0.35;

/** Default UI sound-effect volume, 0–1. */
export const SFX_VOLUME = 0.6;
