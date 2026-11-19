/**
 * The avatar's animation clips.
 *
 * The Tripo export ships them as `NlaTrack`, `NlaTrack.001` … `NlaTrack.006`,
 * which is useless in a UI. These names were assigned by measuring each clip:
 * total angular travel per limb group and hip displacement, so `idle` really is
 * the stillest clip and `dance` really is the busiest.
 *
 * What a clip is called on screen is in the home dictionary (`avatar.clips`),
 * keyed by `id` — to rename one, edit it there. Nothing shows the raw track names.
 */
export type AvatarClipId = 'idle' | 'wave' | 'greet' | 'talk' | 'cheer' | 'sway' | 'dance';

export interface AvatarClip {
  readonly id: AvatarClipId;
  /** Exact track name inside avatar.glb. */
  readonly track: string;
  /** Roughly how long the clip runs, in seconds. */
  readonly seconds: number;
}

export const AVATAR_CLIPS: readonly AvatarClip[] = [
  { id: 'idle', track: 'NlaTrack', seconds: 4.8 },
  { id: 'wave', track: 'NlaTrack.004', seconds: 3.2 },
  { id: 'greet', track: 'NlaTrack.003', seconds: 5.7 },
  { id: 'talk', track: 'NlaTrack.006', seconds: 10.9 },
  { id: 'cheer', track: 'NlaTrack.001', seconds: 4.3 },
  { id: 'sway', track: 'NlaTrack.005', seconds: 12.5 },
  { id: 'dance', track: 'NlaTrack.002', seconds: 11.0 },
];

export const DEFAULT_CLIP = AVATAR_CLIPS[0];

export const findClip = (track: string): AvatarClip | undefined =>
  AVATAR_CLIPS.find((clip) => clip.track === track);
