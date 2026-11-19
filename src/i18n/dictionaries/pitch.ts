import type { Locale } from '../config';

/**
 * Strings for /pitch that are not the pitches themselves. The fifty lines, the
 * marquee and the flying reels are content: `src/content/hard-sell.ts` and its
 * Chinese twin.
 */

const en = {
  meta: {
    title: 'The pitch',
    description:
      'One slider, fifty positions, from "what of it?" to a page actively shouting. Every claim on it is true; only the volume changes.',
  },

  /** The way out, which this route has to bring itself — it covers the header. */
  backToSite: 'Back to the site',

  /** Pinned above the line once things warm up. */
  badge: '1st place · NYP × AWS Hackathon 2026',
  /** The huge faint word behind the line at the loud end. Decorative. */
  ghost: 'HIRE',
  /** The rubber stamp, above the year. */
  stamp: 'Available',
  emailMe: 'Email me',
  /** Accessible name of a project reel flying past. */
  reel: (project: string) => `${project} case study`,

  slider: {
    label: (max: number) => `How hard should Richie sell himself? 1 is least, ${max} is most.`,
    /** What a screen reader announces as the slider moves. */
    value: (level: number, max: number, line: string) => `${level} of ${max}: ${line}`,
    less: 'Less Hard Sell',
    more: 'More Hard Sell',
  },
};

const zh: typeof en = {
  meta: {
    title: '毛遂自荐',
    description:
      '一个滑块，50 档，从“那又怎样？”一路推到整页都在大喊。句句属实，变的只有音量。',
  },

  backToSite: '返回网站',

  badge: 'NYP × AWS 黑客松 2026 · 冠军',
  ghost: '录用',
  /* What a recruiter's stamp would say: ready to start, in that year. */
  stamp: '可到岗',
  emailMe: '发邮件给我',
  reel: (project) => `${project} 项目案例`,

  slider: {
    label: (max) => `Richie 该把自己推销得多卖力？1 最收敛，${max} 最卖力。`,
    value: (level, max, line) => `第 ${level} 档，共 ${max} 档：${line}`,
    less: '收敛一点',
    more: '卖力一点',
  },
};

export const pitchDict: Record<Locale, typeof en> = { en, zh };
