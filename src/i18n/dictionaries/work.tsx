import type { ReactNode } from 'react';
import type { Locale } from '../config';

/**
 * Strings for the work index, the case-study pages and the screenshot gallery.
 *
 * The projects themselves — summaries, metrics, the case-study prose — are
 * content, in `src/content/projects.ts` and its Chinese twin. This is the frame:
 * the headings each case study is laid out under, and the controls around it.
 */

/** Wraps part of a sentence in whatever element the page styles it with. */
type Wrap = (text: string) => ReactNode;

const en = {
  meta: {
    title: 'Work',
    description:
      'Case studies from shipped work — SmartRecap (1st place, NYP × AWS Hackathon 2026), CertAIn, Singink, SwapLah, and a CCA website built from wireframe to deploy.',
  },

  index: {
    heading: (accent: Wrap): ReactNode => <>Things I have {accent('actually shipped')}</>,
    lede: 'Full case studies. Each covers the problem I was handed, what I built, the trade-offs I made, and what changed as a result — not just a screenshot and a tech list.',
  },

  status: {
    completed: 'Completed',
    inProgress: 'In progress',
  },

  /** Section headings on a case study, in the order they appear. */
  caseStudy: {
    allWork: 'All work',
    whatItDoes: 'What it does',
    builtWith: 'Built with',
    walkthrough: 'Walkthrough',
    walkthroughHint: 'Scroll to follow the build, screen by screen.',
    theCaseStudy: 'The case study',
    architecture: 'Architecture',
    code: 'A slice of the code',
    demo: 'Demo',
    /** The video's accessible name. */
    demoTitle: (project: string) => `${project} demo`,
    takeaways: 'What I took away',
    next: (project: string) => `Next: ${project}`,
  },

  gallery: {
    expand: 'Expand',
    /** Name of the row of thumbnails. */
    screenshots: 'Screenshots',
    close: 'Close',
    previous: 'Previous screenshot',
    next: 'Next screenshot',
  },
};

const zh: typeof en = {
  meta: {
    title: '作品',
    description:
      '做完并交付的项目案例：SmartRecap（2026 年 NYP × AWS 黑客松冠军）、CertAIn、Singink、SwapLah，还有一个从线框图一路做到上线的 CCA 网站。',
  },

  index: {
    heading: (accent) => <>我{accent('真正交付过')}的项目</>,
    lede: '完整的项目案例。每一篇都会讲清楚：我接手时面对的问题、我做了什么、做了哪些取舍，以及最后带来了什么改变——不只是一张截图加一串技术栈。',
  },

  status: {
    completed: '已完成',
    inProgress: '进行中',
  },

  caseStudy: {
    allWork: '全部作品',
    whatItDoes: '主要功能',
    builtWith: '技术栈',
    walkthrough: '逐屏导览',
    walkthroughHint: '往下滚动，一屏一屏看它是怎么搭起来的。',
    theCaseStudy: '项目复盘',
    architecture: '架构',
    code: '代码节选',
    demo: '演示',
    demoTitle: (project) => `${project} 演示视频`,
    takeaways: '我的收获',
    next: (project) => `下一个：${project}`,
  },

  gallery: {
    expand: '放大查看',
    screenshots: '截图',
    close: '关闭',
    previous: '上一张截图',
    next: '下一张截图',
  },
};

export const workDict: Record<Locale, typeof en> = { en, zh };
