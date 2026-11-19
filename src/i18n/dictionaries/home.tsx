import type { ReactNode } from 'react';
import type { AvatarClipId } from '@/components/three/avatarClips';
import type { Locale } from '../config';

/**
 * Strings for the top half of the home page: the hero and the avatar beside it,
 * the numbers under it, About, and the lanyard badge.
 *
 * The facts these sentences frame — the role, the bio, the rotating
 * specialisation, the stats, the marquee — are content, and come from
 * `profileContent`. What is here is the page's own wording around them.
 */

/** Wraps part of a sentence in whatever element the component styles it with. */
type Wrap = (text: string) => ReactNode;

const en = {
  hero: {
    /**
     * The headline, one entry per line. Position decides the treatment: the last
     * line takes the lime gradient and any line between the first and the last
     * is outlined, so a language can break the same claim into fewer lines and
     * still end on the accent.
     */
    headline: ['Full-stack', 'developer,', 'UX designer.'],
    /** `specialism` is the rotating word; `accent` sets the hackathon apart. */
    intro: (specialism: ReactNode, accent: Wrap): ReactNode => (
      <>
        Diploma in Information Technology at Nanyang Polytechnic, specialising in {specialism}.
        First place at the {accent('NYP × AWS Hackathon 2026')}. Seeking a 2027 software
        engineering internship in Singapore.
      </>
    ),
    viewWork: 'View my work',
    resume: 'Résumé',
    scroll: 'Scroll',
  },

  stats: {
    /** Screen-reader name for the band of headline numbers. */
    label: 'At a glance',
  },

  about: {
    title: 'About',
    exploring: 'Currently exploring',
    /**
     * Phrases brought into focus as the bio scrolls in. Each must exist verbatim
     * in `profile.bio` in the same language — one that does not simply never
     * highlights, so the two are edited together.
     */
    highlights: [
      'the interface, the API behind it, and the research',
      'Full-Stack Development and Digital UX Design',
      'Five of them were blocked by a map popup',
      'first place at the NYP × AWS Hackathon 2026',
      '2027 software engineering internship',
    ],
  },

  /** The 3D avatar beside the headline, and the chips that pick its animation. */
  avatar: {
    /** Shown in place of the canvas when the browser cannot give it WebGL. */
    unavailable: (lineBreak: ReactNode): ReactNode => (
      <>3D preview needs WebGL.{lineBreak}Your browser or GPU has it switched off.</>
    ),
    controlsLabel: 'Avatar animation',
    auto: 'Auto',
    /** Tooltip on the Auto chip. It names what pressing it will do. */
    autoTitle: (cycling: boolean): string =>
      cycling ? 'Stop cycling through animations' : 'Cycle through animations',
    /** Keyed by clip id, so a clip added to `avatarClips.ts` fails to compile until it is named. */
    clips: {
      idle: 'Idle',
      wave: 'Wave',
      greet: 'Greet',
      talk: 'Talk',
      cheer: 'Cheer',
      sway: 'Sway',
      dance: 'Dance',
    } satisfies Record<AvatarClipId, string>,
  },

  /** The draggable ID badge in the contact section. */
  badge: {
    dragHint: 'Drag the badge',
    /** The still image that touch and reduced-motion visitors get instead. */
    alt: 'Richie Koh — Software Developer, Nanyang Polytechnic',
  },
};

const zh: typeof en = {
  hero: {
    headline: ['全栈开发者，', '也做 UX 设计'],
    intro: (specialism, accent) => (
      <>
        在南洋理工学院修读资讯科技专业文凭，主修{specialism}。
        {accent('2026 年 NYP × AWS 黑客松')}冠军。正在找 2027 年在新加坡的软件工程实习。
      </>
    ),
    viewWork: '看看作品',
    resume: '简历',
    scroll: '向下滚动',
  },

  stats: {
    label: '概览',
  },

  about: {
    title: '关于我',
    exploring: '最近在研究',
    highlights: [
      '从界面，到界面背后的 API，再到决定这两者该做什么的用户研究',
      '全栈开发与数字用户体验设计',
      '其中 5 人被一个地图弹窗卡住了',
      '在 2026 年的 NYP × AWS 黑客松上拿了冠军',
      '2027 年在新加坡的软件工程实习',
    ],
  },

  avatar: {
    unavailable: (lineBreak) => <>3D 预览需要 WebGL，{lineBreak}但你的浏览器或 GPU 把它关掉了。</>,
    controlsLabel: '虚拟形象动作',
    auto: '自动',
    autoTitle: (cycling) => (cycling ? '停止自动轮播' : '自动轮播动作'),
    clips: {
      idle: '待机',
      wave: '挥手',
      greet: '问好',
      talk: '说话',
      cheer: '欢呼',
      sway: '摇摆',
      dance: '跳舞',
    },
  },

  badge: {
    dragHint: '拖一拖工牌',
    alt: 'Richie Koh 的工牌：软件工程师，南洋理工学院',
  },
};

export const homeDict: Record<Locale, typeof en> = { en, zh };
