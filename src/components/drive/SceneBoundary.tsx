'use client';

import { Component, type ReactNode } from 'react';

/**
 * Catches anything the 3D scene throws.
 *
 * The scene runs a physics engine compiled to WebAssembly, and the failure mode
 * that prompted this was a rigid body being freed on the Rust side while a
 * JavaScript reference to it was still live — which traps in wasm rather than
 * raising anything a normal guard would see coming. That specific bug is fixed
 * at its source, but the class of bug is not one a visitor should ever meet as a
 * stack trace over the page.
 *
 * A class component because that is still the only way to implement a React
 * error boundary; there is no hook equivalent.
 */
export class SceneBoundary extends Component<
  { children: ReactNode; fallback: (reset: () => void) => ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    /* Left in deliberately: if this ever fires in the wild, the console is the
       only place the cause can be recovered from. */
    console.error('drive: scene failed', error);
  }

  reset = () => this.setState({ failed: false });

  render() {
    if (this.state.failed) return this.props.fallback(this.reset);
    return this.props.children;
  }
}
