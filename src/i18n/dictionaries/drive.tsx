import type { ReactNode } from 'react';
import type { QualityId } from '@/components/drive/quality';
import type { Locale } from '../config';

/**
 * Strings for the drivable world at /drive: the start card, the HUD laid over
 * the canvas, and the panels that take the scene's place when it cannot run.
 *
 * Only what is drawn in HTML is here. Lettering that belongs to the world — the
 * letters in the plaza, the boards over the gates, the dials in the cockpit — is
 * geometry and canvas texture, and reads the same in both languages.
 *
 * Districts and cars are content rather than interface, and live in
 * `content/drive-world.ts` and `content/drive-vehicles.ts` with their Chinese
 * twins. The graphics tiers are here because their settings are not text: the
 * numbers stay in `components/drive/quality.ts`, and this holds what each tier
 * is called.
 */

/** Wraps part of a sentence in whatever element the component styles it with. */
type Wrap = (text: string) => ReactNode;

const en = {
  meta: {
    title: 'Drive',
    description:
      'A drivable corner of the portfolio. Real vehicle physics, a plaza to knock about, and my work parked around it.',
  },

  /** The way out, which this route has to bring itself — it covers the header. */
  backToSite: 'Back to the site',

  startCard: {
    title: (accent: Wrap) => <>Take the {accent('car')} out</>,
    lede: 'A town with a ring road, a real day and night cycle, and my work behind six gates. Nothing here is on the critical path of the portfolio — it loads only if you ask.',
    pickBody: 'Pick a body',
    eachDiffers: 'Each one has its own pace, brakes and engine note',
    graphics: 'Graphics',
    engineSound: (on: boolean): string => (on ? 'Engine sound on' : 'Engine sound off'),
    start: 'Start engine',
  },

  /** Keyed by tier id, so a tier added to `quality.ts` fails to compile until it is named. */
  quality: {
    high: {
      name: 'High',
      blurb: 'Soft shadows, bloom, full resolution. Wants a discrete GPU.',
    },
    balanced: {
      name: 'Balanced',
      blurb: 'Soft shadows at half the resolution. The default.',
    },
    safe: {
      name: 'Safe',
      blurb: 'No post-processing, hard shadows. For laptops and older GPUs.',
    },
  } satisfies Record<QualityId, { name: string; blurb: string }>,

  /**
   * What each key does. The key caps themselves are written in the components:
   * a key is called what is printed on it, in any language. Space is the one
   * exception, because in Chinese that key has a name.
   */
  controls: {
    space: 'Space',
    drive: 'Drive',
    handbrake: 'Handbrake',
    horn: 'Horn',
    changeView: 'Change view',
    openProject: 'Open a project',
    openChapter: 'Open a chapter',
    reset: 'Reset',
  },

  /** Shown while the physics engine and the renderer download. */
  loading: 'Warming the engine',

  /** The mute button once driving. It names the state it is in, not the one it leads to. */
  sound: {
    on: 'Sound on',
    muted: 'Muted',
  },

  hud: {
    next: (position: number, total: number) => `Next · ${position} of ${total}`,
    allFound: (total: number) => `All ${total} found`,
    wholeCv: 'That is the whole CV. Drive around as long as you like.',
    speedUnit: 'kph',
    /** How long a full day and night takes, in real minutes. */
    dayLength: (minutes: number) => `${minutes} min day`,
    timeOfDay: 'Time of day',
    clockHolding: 'Holding',
    clockRunning: 'Running',
    open: 'Press E to open',
  },

  reducedMotion: {
    heading: 'This one is all movement',
    body: 'Your system asks for reduced motion, and a driving game is continuous camera movement by definition — there is no calmer version of it worth shipping. Everything it links to lives on the ordinary pages.',
    seeWork: 'See the work instead',
  },

  contextLost: {
    heading: 'The graphics ran out of room',
    cause:
      'Your browser gave up the 3D context, which it does when the GPU is asked for more than it has. Nothing is broken and nothing was lost — it just cannot carry on from here.',
    turnedDown: (tier: string, accent: Wrap) => (
      <>Graphics have been turned down to {accent(tier)}. Starting again should hold.</>
    ),
    restart: 'Start again',
  },
};

const zh: typeof en = {
  meta: {
    title: '兜风',
    description:
      '作品集里能开车的一角：真实的车辆物理，一片任你横冲直撞的广场，我的作品就停在周围。',
  },

  backToSite: '返回网站',

  startCard: {
    title: (accent) => <>开{accent('车')}兜风</>,
    lede: '一座小镇，一条环路，昼夜真的会交替，6 道门后面是我的作品。这里不是作品集的必经之路——点了才加载。',
    pickBody: '选个车型',
    eachDiffers: '快慢、刹车、引擎声，每辆都不一样',
    graphics: '画质',
    engineSound: (on) => (on ? '引擎声：开' : '引擎声：关'),
    start: '启动引擎',
  },

  quality: {
    high: {
      name: '高',
      blurb: '软阴影、泛光、全分辨率，要独立显卡才带得动。',
    },
    balanced: {
      name: '均衡',
      blurb: '软阴影，阴影分辨率减半。默认就是这一档。',
    },
    safe: {
      name: '稳妥',
      blurb: '不做后期处理，只用硬阴影。适合笔记本和老显卡。',
    },
  },

  controls: {
    space: '空格',
    drive: '驾驶',
    handbrake: '手刹',
    horn: '喇叭',
    changeView: '切换视角',
    openProject: '打开项目',
    openChapter: '打开章节',
    reset: '重置',
  },

  loading: '正在热车',

  sound: {
    on: '声音已开',
    muted: '已静音',
  },

  hud: {
    next: (position, total) => `下一站 · ${position}/${total}`,
    allFound: (total) => `${total} 站都到过了`,
    wholeCv: '整份简历就这些了。想开多久就开多久。',
    /* The form Chinese readers know the unit by, and what the cockpit dial says. */
    speedUnit: 'km/h',
    dayLength: (minutes) => `${minutes} 分钟一昼夜`,
    timeOfDay: '一天中的时刻',
    clockHolding: '时间定格',
    clockRunning: '时间流动',
    open: '按 E 打开',
  },

  reducedMotion: {
    heading: '这一页从头动到尾',
    body: '你的系统开启了“减少动态效果”，而开车游戏本来就是镜头动个不停——做不出一个值得上线的“安静版”。它通向的内容，普通页面上都有。',
    seeWork: '直接看作品',
  },

  contextLost: {
    heading: '显卡撑不住了',
    cause:
      '浏览器刚刚丢掉了 3D 上下文——向 GPU 要的比它有的还多，就会这样。什么都没坏，什么也没丢，只是没法从这儿接着开了。',
    turnedDown: (tier, accent) => <>画质已降到“{accent(tier)}”档，再来一次应该撑得住。</>,
    restart: '重新开始',
  },
};

export const driveDict: Record<Locale, typeof en> = { en, zh };
