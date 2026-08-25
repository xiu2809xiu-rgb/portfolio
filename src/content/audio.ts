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
 * A note worth knowing rather than finding out later: this site is public, so
 * anything here is being publicly performed. Music you did not create or license
 * can draw a takedown regardless of whether it is instrumental. Royalty-free
 * sources that are safe for this: incompetech.com, freemusicarchive.org (check
 * the per-track licence), or the YouTube Audio Library.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const playlist: readonly Track[] = [
  // Example of the shape — delete this and add your own:
  // { src: '/audio/late-night-build.mp3', title: 'Late Night Build', artist: 'Someone' },
];

/** Default music volume, 0–1. Deliberately low: it is a background, not a set. */
export const MUSIC_VOLUME = 0.35;

/** Default UI sound-effect volume, 0–1. */
export const SFX_VOLUME = 0.6;
