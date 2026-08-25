'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MUSIC_VOLUME, SFX_VOLUME, playlist } from '@/content/audio';
import { soundEngine, type SoundName } from '@/lib/audio/SoundEngine';

interface AudioState {
  sfxEnabled: boolean;
  musicPlaying: boolean;
  trackIndex: number;
  hasMusic: boolean;
  toggleSfx: () => void;
  toggleMusic: () => void;
  nextTrack: () => void;
  play: (name: SoundName) => void;
}

const AudioContext = createContext<AudioState | null>(null);

const SFX_KEY = 'rk:sfx';
const MUSIC_KEY = 'rk:music';

/**
 * Owns interface sounds and the background music player.
 *
 * Defaults are deliberate. Sound effects start **on** because they only fire on
 * a deliberate click and are ~70ms long. Music starts **off** — every browser
 * blocks autoplaying audio anyway, and a portfolio that starts playing at
 * someone in an open-plan office gets closed, not read. Both choices persist to
 * localStorage, so a visitor only decides once.
 *
 * Click sounds are wired by delegation on `document` rather than by threading a
 * handler through every button: new buttons and third-party components get the
 * sound for free, and nothing has to be remembered when adding a page.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const [sfxEnabled, setSfxEnabled] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasMusic = playlist.length > 0;

  // Restore preferences. Deferred a frame to keep the write out of the effect body.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setSfxEnabled(localStorage.getItem(SFX_KEY) !== 'off');
        // Music never auto-restores to playing; the visitor presses play.
      } catch {
        setSfxEnabled(true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    soundEngine.setVolume(SFX_VOLUME);
    soundEngine.setMuted(!sfxEnabled);
  }, [sfxEnabled]);

  const play = useCallback(
    (name: SoundName) => {
      if (sfxEnabled) soundEngine.play(name);
    },
    [sfxEnabled],
  );

  /** Global click sounds, by delegation. */
  useEffect(() => {
    if (!sfxEnabled) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const interactive = target?.closest?.(
        'a, button, [role="button"], [role="option"], [role="tab"], summary',
      );
      if (!interactive) return;
      // Anything explicitly opted out (the audio control itself handles its own).
      if (interactive.closest('[data-no-sound]')) return;
      soundEngine.play('click');
    };

    document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
    return () =>
      document.removeEventListener('pointerdown', onPointerDown, { capture: true });
  }, [sfxEnabled]);

  const toggleSfx = useCallback(() => {
    setSfxEnabled((value) => {
      const next = !value;
      try {
        localStorage.setItem(SFX_KEY, next ? 'on' : 'off');
      } catch {
        /* private mode */
      }
      // Unlock inside the gesture, then confirm audibly that it is on.
      if (next) {
        void soundEngine.unlock().then(() => {
          soundEngine.setMuted(false);
          soundEngine.play('toggle');
        });
      }
      return next;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    if (!hasMusic) return;

    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.volume = MUSIC_VOLUME;
      void audio
        .play()
        .then(() => {
          setMusicPlaying(true);
          try {
            localStorage.setItem(MUSIC_KEY, 'on');
          } catch {
            /* private mode */
          }
        })
        .catch(() => {
          // Autoplay policy or a missing file; leave the control in its off state.
          setMusicPlaying(false);
        });
    } else {
      audio.pause();
      setMusicPlaying(false);
      try {
        localStorage.setItem(MUSIC_KEY, 'off');
      } catch {
        /* private mode */
      }
    }
  }, [hasMusic]);

  const nextTrack = useCallback(() => {
    if (playlist.length < 2) return;
    setTrackIndex((index) => (index + 1) % playlist.length);
  }, []);

  // Keep playing across a track change, but only if it was already playing.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !musicPlaying) return;
    void audio.play().catch(() => setMusicPlaying(false));
  }, [trackIndex, musicPlaying]);

  const value = useMemo<AudioState>(
    () => ({
      sfxEnabled,
      musicPlaying,
      trackIndex,
      hasMusic,
      toggleSfx,
      toggleMusic,
      nextTrack,
      play,
    }),
    [sfxEnabled, musicPlaying, trackIndex, hasMusic, toggleSfx, toggleMusic, nextTrack, play],
  );

  return (
    <AudioContext.Provider value={value}>
      {children}
      {hasMusic ? (
        <audio
          ref={audioRef}
          src={playlist[trackIndex]?.src}
          preload="none"
          onEnded={nextTrack}
          // Never `autoPlay` — see the note above.
        />
      ) : null}
    </AudioContext.Provider>
  );
}

export function useAudio(): AudioState {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used inside <AudioProvider>');
  }
  return context;
}
