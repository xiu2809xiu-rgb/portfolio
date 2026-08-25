'use client';

import { Music, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { playlist } from '@/content/audio';
import { cn } from '@/lib/utils';
import { useAudio } from './AudioProvider';

/**
 * Corner control for sound and music.
 *
 * Bottom-left rather than in the header: audio is a preference, not navigation,
 * and it should be reachable from anywhere on a long page without scrolling
 * back up. Marked `data-no-sound` so the click-sound delegation ignores it —
 * playing a click while muting is a small absurdity.
 */
export function AudioControl() {
  const { sfxEnabled, musicPlaying, trackIndex, hasMusic, toggleSfx, toggleMusic, nextTrack } =
    useAudio();

  const track = playlist[trackIndex];

  return (
    <div
      data-no-sound
      className="fixed bottom-4 left-4 z-40 flex items-center gap-1 rounded-full border border-hairline bg-[#05070a]/80 p-1 backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={toggleSfx}
        aria-pressed={sfxEnabled}
        title={sfxEnabled ? 'Mute interface sounds' : 'Unmute interface sounds'}
        className={cn(
          'grid size-8 place-items-center rounded-full transition-colors',
          sfxEnabled
            ? 'bg-lime/12 text-lime'
            : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
        )}
      >
        {sfxEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
        <span className="sr-only">
          {sfxEnabled ? 'Mute interface sounds' : 'Unmute interface sounds'}
        </span>
      </button>

      {hasMusic ? (
        <>
          <span className="h-4 w-px bg-hairline" aria-hidden />

          <button
            type="button"
            onClick={toggleMusic}
            aria-pressed={musicPlaying}
            title={musicPlaying ? 'Pause music' : 'Play background music'}
            className={cn(
              'grid size-8 place-items-center rounded-full transition-colors',
              musicPlaying
                ? 'bg-lime/12 text-lime'
                : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
            )}
          >
            {musicPlaying ? <Pause className="size-3.5" /> : <Music className="size-3.5" />}
            <span className="sr-only">
              {musicPlaying ? 'Pause music' : 'Play background music'}
            </span>
          </button>

          {musicPlaying && track ? (
            <>
              <span className="max-w-[9rem] truncate pl-1 pr-1 font-mono text-[0.62rem] text-muted-foreground">
                {track.title}
              </span>

              {playlist.length > 1 ? (
                <button
                  type="button"
                  onClick={nextTrack}
                  title="Next track"
                  className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                >
                  <SkipForward className="size-3.5" />
                  <span className="sr-only">Next track</span>
                </button>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
