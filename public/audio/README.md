# Background music

Drop your audio files in this folder, then register each one in
`src/content/audio.ts`:

```ts
export const playlist: readonly Track[] = [
  { src: '/audio/your-file.mp3', title: 'Track name', artist: 'Artist' },
];
```

The player appears in the bottom-left corner as soon as the playlist is
non-empty, and hides itself again if it is empty.

**Format** — `.mp3` is the safe universal choice; `.m4a` also works everywhere
that matters. Keep files under about 4 MB each: the player streams rather than
preloads, but a phone on mobile data still pays for what it plays.

**Licensing** — this site is public, so anything here is publicly performed.
Music you did not create or license can draw a takedown regardless of whether
it is instrumental. Safe sources: incompetech.com, freemusicarchive.org (check
each track's licence), or the YouTube Audio Library.
