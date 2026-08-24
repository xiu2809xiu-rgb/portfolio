/**
 * Friendly names for the avatar's animation clips.
 *
 * The Tripo export ships them as `NlaTrack`, `NlaTrack.001` … `NlaTrack.006`,
 * which is useless in a UI. These labels were assigned by measuring each clip:
 * total angular travel per limb group and hip displacement, so "Idle" really is
 * the stillest clip and "Dance" really is the busiest.
 *
 * To rename one, edit `label` here — nothing else reads the raw track names.
 */
export interface AvatarClip {
  /** Exact track name inside avatar.glb. */
  readonly track: string;
  readonly label: string;
  /** Roughly how long the clip runs, in seconds. */
  readonly seconds: number;
}

export const AVATAR_CLIPS: readonly AvatarClip[] = [
  { track: 'NlaTrack', label: 'Idle', seconds: 4.8 },
  { track: 'NlaTrack.004', label: 'Wave', seconds: 3.2 },
  { track: 'NlaTrack.003', label: 'Greet', seconds: 5.7 },
  { track: 'NlaTrack.006', label: 'Talk', seconds: 10.9 },
  { track: 'NlaTrack.001', label: 'Cheer', seconds: 4.3 },
  { track: 'NlaTrack.005', label: 'Sway', seconds: 12.5 },
  { track: 'NlaTrack.002', label: 'Dance', seconds: 11.0 },
];

export const DEFAULT_CLIP = AVATAR_CLIPS[0];

export const findClip = (track: string): AvatarClip | undefined =>
  AVATAR_CLIPS.find((clip) => clip.track === track);
