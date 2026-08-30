'use client';

import { useEffect, useRef } from 'react';

export interface DriveInput {
  /** -1 full left … +1 full right */
  steer: number;
  /** -1 full reverse … +1 full throttle */
  throttle: number;
  brake: boolean;
  reset: boolean;
  interact: boolean;
}

/** Shared mutable input, written by keyboard and touch alike. */
export type DriveInputRef = { current: DriveInput };

const KEYS: Record<string, keyof typeof AXES | 'brake' | 'reset' | 'interact'> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  Space: 'brake',
  KeyR: 'reset',
  KeyE: 'interact',
};

const AXES = { forward: 0, back: 0, left: 0, right: 0 };

/**
 * Keyboard driving input, smoothed.
 *
 * Steering and throttle are eased toward their target rather than snapped. A
 * raw digital key on a raycast vehicle makes the front wheels teleport to full
 * lock, which reads as twitchy and unsettles the suspension; ramping over a few
 * frames is what gives a keyboard the feel of an analogue stick.
 *
 * Returns a ref rather than state on purpose — this is read inside the physics
 * step, and re-rendering React 60 times a second to carry two numbers would be
 * the most expensive part of the whole scene.
 */
export function useDriveControls(): DriveInputRef {
  const input = useRef<DriveInput>({
    steer: 0,
    throttle: 0,
    brake: false,
    reset: false,
    interact: false,
  });

  useEffect(() => {
    const held = { ...AXES };
    let frame = 0;

    const onKey = (event: KeyboardEvent, down: boolean) => {
      const action = KEYS[event.code];
      if (!action) return;

      // Arrow keys and space scroll the page; a driving surface must not.
      if (event.code.startsWith('Arrow') || event.code === 'Space') event.preventDefault();

      if (action === 'brake') input.current.brake = down;
      else if (action === 'reset') input.current.reset = down;
      else if (action === 'interact') input.current.interact = down;
      else held[action] = down ? 1 : 0;
    };

    const downHandler = (e: KeyboardEvent) => onKey(e, true);
    const upHandler = (e: KeyboardEvent) => onKey(e, false);

    /* Releasing focus must not leave a key stuck on. */
    const clear = () => {
      Object.keys(held).forEach((key) => {
        held[key as keyof typeof AXES] = 0;
      });
      input.current.brake = false;
    };

    const tick = () => {
      const targetSteer = held.right - held.left;
      const targetThrottle = held.forward - held.back;

      // Steering returns to centre faster than it turns in, the way a real rack does.
      const steerRate = targetSteer === 0 ? 0.22 : 0.12;
      input.current.steer += (targetSteer - input.current.steer) * steerRate;
      input.current.throttle += (targetThrottle - input.current.throttle) * 0.14;

      if (Math.abs(input.current.steer) < 0.002) input.current.steer = 0;
      if (Math.abs(input.current.throttle) < 0.002) input.current.throttle = 0;

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);
    window.addEventListener('blur', clear);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
      window.removeEventListener('blur', clear);
    };
  }, []);

  return input;
}
