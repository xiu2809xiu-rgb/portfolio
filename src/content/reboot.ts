export interface RebootStep {
  /** What the line says it is doing. */
  readonly label: string;
  /** The real figure behind it, printed on the right. */
  readonly detail: string;
  /** How long the line dwells before the next one, in ms. */
  readonly ms: number;
}

/**
 * The lines that stream during the reboot sequence.
 *
 * Every figure here is real and was measured during the build — the model size
 * and clip count come from `optimize-avatar.mjs`, the VRAM estimate from the
 * same script, the route count from `next build`, and the marquee figure from
 * the in-page transform measurement. A loading screen that invents numbers is
 * just a progress bar with extra steps; one that tells you true things about the
 * site you are on is worth watching once.
 */
export const rebootSteps: readonly RebootStep[] = [
  { label: 'resolving design tokens', detail: 'lime · aqua · ink', ms: 260 },
  { label: 'mounting avatar.glb', detail: '2.09 MB · 7 clips', ms: 420 },
  { label: 'warming WebGL context', detail: '~48 MB VRAM', ms: 340 },
  { label: 'compiling shaders', detail: 'aurora · particles', ms: 300 },
  { label: 'hydrating routes', detail: '23 static', ms: 280 },
  { label: 'checking calendar', detail: 'free/busy only', ms: 380 },
  { label: 'ready', detail: 'welcome back', ms: 420 },
];

export const REBOOT_TOTAL_MS = rebootSteps.reduce((total, step) => total + step.ms, 0);
