import { rebootSteps as en, type RebootStep } from '../reboot';

export * from '../reboot';

/**
 * The reboot log, in Chinese.
 *
 * It is a terminal talking, so what a terminal would print in Latin anywhere
 * stays as it is and is simply inherited from the English line: the file name,
 * the token and shader names, and the `ready` it ends on. Only the prose
 * around them is restated.
 *
 * Keyed by the English label and laid over the English list, so both languages
 * always play the same lines in the same order with the same timing — which is
 * also why `REBOOT_TOTAL_MS` from the star export is already right here.
 *
 * The figures are restated by hand. When a measurement changes in `reboot.ts`,
 * the line here has to change with it, or this log stops being true.
 */
const zh: Readonly<Record<string, Partial<Pick<RebootStep, 'label' | 'detail'>>>> = {
  'resolving design tokens': { label: '解析设计令牌' },
  'mounting avatar.glb': { label: '挂载 avatar.glb', detail: '2.09 MB · 7 段动画' },
  'warming WebGL context': { label: '预热 WebGL 上下文', detail: '约 48 MB 显存' },
  'compiling shaders': { label: '编译着色器' },
  'hydrating routes': { label: '水合路由', detail: '44 条静态路由' },
  'checking calendar': { label: '查询日历', detail: '只看忙闲' },
  ready: { detail: '欢迎回来' },
};

export const rebootSteps: readonly RebootStep[] = en.map((step) => ({
  ...step,
  ...zh[step.label],
}));
