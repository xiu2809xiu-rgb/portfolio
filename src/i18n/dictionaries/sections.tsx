import type { ReactNode } from 'react';
import type { Locale } from '../config';

/**
 * Strings for the home page from Skills down to Contact, and for the
 * holographic award card.
 *
 * What these sections list is content, not interface: the skill groups,
 * experience, process steps, achievements and the testimonial come from
 * `content/resume.ts`, the work carousel from `content/projects.ts`, and the
 * names of the two detours from the navigation. This file holds what frames
 * them — headings, ledes, buttons, and what a screen reader is told.
 *
 * Section numbers are not here. They are layout, set where each section sits on
 * the page, so reordering the page never means editing both languages.
 */

/** Wraps part of a sentence in whatever element the component styles it with. */
type Wrap = (text: string) => ReactNode;

const en = {
  skills: {
    title: 'Skills',
    description:
      'What I build with. Where each of these was actually used is in the case studies.',
  },

  work: {
    /** The section's name: the heading without motion, and the pinned section's label. */
    title: 'Work',
    eyebrow: (index: string) => `${index} — Work`,
    scrollHint: 'Scroll to enter',
    /** The looping preview on a card. `name` is the project's title and subtitle. */
    previewAlt: (name: string) => `${name} preview`,
  },

  detours: {
    eyebrow: 'Detours',
    /** `accent` wraps the word set in the lime gradient. */
    heading: (accent: Wrap): ReactNode => <>Two things that are {accent('not')} a portfolio</>,
    lede: 'Built for the fun of it, and because a site that only lists work tells you nothing about how someone builds. Neither is on the critical path — both load only when opened.',
    /** One card per page. Each card's title is the page's name in the navigation. */
    drive: {
      eyebrow: 'Interactive',
      body: 'A town with a ring road, a real day and night cycle, and my projects behind six gates. Written with its own suspension and tyre model, because the physics engine’s built-in one would not drive.',
      meta: 'WASD · about 2 MB · loads only if you ask',
    },
    pitch: {
      eyebrow: 'A joke with a CV inside it',
      body: 'One slider, fifty positions, from “so, yeah, I write software” to a page actively shouting at you. Every claim on it is true — only the volume changes.',
      meta: 'Drag the dial · find where it tips',
    },
  },

  experience: {
    title: 'Experience',
  },

  process: {
    title: 'How I work',
    description:
      'Not a framework I can recite — the actual order things happen in, with a real instance under each step.',
    /** The kicker on each card. `index` is the step's two-digit number. */
    step: (index: string) => `Step ${index}`,
    /** What a screen reader calls the pinned region the cards scroll through. */
    stackLabel: 'Scrolling card stack',
  },

  achievements: {
    title: 'Achievements',
    description:
      'Competitions, certifications, and the responsibilities I have been trusted with.',
    /** One of the older entries under the list, as a single line. `name` styles the title. */
    minorEntry: (name: Wrap, title: string, organisation: string, body: string): ReactNode => (
      <>
        {name(title)} — {organisation}. {body}
      </>
    ),
  },

  /**
   * The first-place card. Laid out like a trading card, so the labels are named
   * after the parts of one: the set line, the rarity mark, the moves and their
   * cost, the serial and the illustrator credit.
   */
  awardCard: {
    flip: 'Turn it over',
    artAlt: 'The SmartRecap application',
    placing: '1st place',
    rarity: 'Holo',
    set: 'Nanyang Polytechnic × AWS · 2026',
    frontend: {
      name: 'Frontend, in full',
      cost: '25 components',
      body: 'Every page component in the product, built in a single overnight sitting.',
    },
    team: {
      name: 'Team Stay Grounded',
      cost: 'PS1',
      body: 'Problem Statement 1 — Automated Class Recap Generator.',
    },
    serial: 'Holo · 001/001',
    credit: (name: string) => `Illus. ${name}`,
    back: {
      blurb: 'The full write-up — what the problem was, what I built, and what it cost.',
      cta: 'Read the case study',
      disclaimer: 'Not a real trading card',
    },
  },

  /** The card component's own fallback, for a caller that does not name the flip. */
  holoCard: {
    flip: 'Flip the card over',
  },

  testimonials: {
    title: 'What others say',
    /**
     * Shown under a quote that is not in the words it was given in. Empty in
     * English, the language it was written in, and an empty note is not rendered.
     */
    translationNote: '',
  },

  contact: {
    eyebrow: (index: string) => `${index} — Contact`,
    /** `accent` wraps the closing words, set in the serif. */
    heading: (accent: Wrap): ReactNode => <>Let’s build {accent('something great.')}</>,
    lede: 'Currently open to internships, collaborations, or just a good conversation about code. The fastest way to reach me is to put something in my calendar.',
    resume: 'Résumé',
  },
};

const zh: typeof en = {
  skills: {
    title: '技能',
    description: '我平时做项目用的技术。每一项具体用在了哪里，都写在项目案例里。',
  },

  work: {
    title: '作品',
    eyebrow: (index) => `${index} — 作品`,
    scrollHint: '向下滚动进入',
    /* Parentheses rather than a trailing word: the name may end in Latin or in Chinese. */
    previewAlt: (name) => `${name}（预览）`,
  },

  detours: {
    eyebrow: '题外话',
    heading: (accent) => <>两样{accent('不算')}作品集的东西</>,
    lede: '一来图个好玩，二来光罗列作品的网站，看不出一个人是怎么做东西的。两样都不在必经之路上——点开了才会加载。',
    drive: {
      eyebrow: '互动体验',
      body: '一座小镇，一条环路，昼夜真的会交替，6 道门后面是我的项目。悬挂和轮胎模型是我自己写的——物理引擎自带的那套根本没法开。',
      meta: 'WASD · 约 2 MB · 点了才加载',
    },
    pitch: {
      eyebrow: '夹带简历的玩笑',
      body: '一个滑块，50 档，从“嗯，我是写软件的”一路推到整个页面冲你大喊大叫。句句属实——变的只是音量。',
      meta: '拖动滑块 · 看它在哪一档失控',
    },
  },

  experience: {
    title: '经历',
  },

  process: {
    title: '我怎么做事',
    description: '不是照本宣科的方法论，而是我实际做事的顺序。每一步下面都附了一个真实的例子。',
    step: (index) => `步骤 ${index}`,
    stackLabel: '随滚动切换的卡片',
  },

  achievements: {
    title: '奖项与成就',
    description: '比赛、证书，还有别人放心交给我的职责。',
    minorEntry: (name, title, organisation, body) => (
      <>
        {name(title)}（{organisation}）：{body}
      </>
    ),
  },

  /*
    “闪卡” is what Chinese collectors call a holo, so the rarity mark is
    translated like any other label. The monogram, the serial number and the
    address stay as they are on the card.
  */
  awardCard: {
    flip: '翻个面',
    artAlt: 'SmartRecap 应用界面',
    placing: '冠军',
    rarity: '闪卡',
    set: '南洋理工学院 × AWS · 2026',
    frontend: {
      name: '前端全包',
      cost: '25 个组件',
      body: '产品的全部页面组件，一个通宵写完。',
    },
    team: {
      name: 'Stay Grounded 队',
      cost: '赛题 1',
      body: '题目：课堂回顾自动生成器。',
    },
    serial: '闪卡 · 001/001',
    credit: (name) => `插画：${name}`,
    back: {
      blurb: '完整的来龙去脉：要解决什么问题，我做了什么，又付出了什么代价。',
      cta: '查看项目案例',
      disclaimer: '并不是真的集换式卡牌',
    },
  },

  holoCard: {
    flip: '把卡片翻个面',
  },

  testimonials: {
    title: '别人怎么说',
    translationNote: '译自英文原文',
  },

  contact: {
    eyebrow: (index) => `${index} — 联系`,
    heading: (accent) => <>一起做点{accent('了不起的东西')}</>,
    lede: '正在找实习，也欢迎合作，单纯想聊聊代码也行。找我最快的办法，是直接在我的日历上约个时间。',
    resume: '简历',
  },
};

export const sectionsDict: Record<Locale, typeof en> = { en, zh };
