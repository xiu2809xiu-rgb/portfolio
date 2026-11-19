import type { ReactNode } from 'react';
import type { Locale } from '../config';

/**
 * Strings for the blog index and the post page.
 *
 * The posts themselves are MDX files — `src/content/blog/<slug>.mdx` and their
 * translations in `src/content/blog/zh/` — and are not repeated here. This is
 * only the frame around them.
 */

/** Wraps part of a sentence in whatever element the page styles it with. */
type Wrap = (text: string) => ReactNode;

const en = {
  meta: {
    title: 'Blog',
    description:
      'Notes on building things — scheduling correctness, 3D performance, and what school projects actually teach you.',
  },

  index: {
    heading: (accent: Wrap): ReactNode => <>Notes from {accent('the build')}</>,
    lede: 'Things I worked out the hard way, written down while the details were still fresh. Mostly the bugs — those are the parts worth reading.',
    empty: 'No posts yet. Check back soon.',
  },

  readingTime: (minutes: number) => `${minutes} min read`,
  draft: 'Draft',

  /**
   * For a post that has not been translated yet, which the other language's
   * site serves in its original language rather than 404ing. Never shown on the
   * English site, which is where every post is written first.
   */
  untranslated: {
    badge: 'In English',
    notice: 'This post is only available in English for now.',
  },

  post: {
    allWriting: 'All writing',
    previous: 'Previous',
    next: 'Next',
    cta: 'Working on something similar, or want to talk it through?',
  },
};

const zh: typeof en = {
  meta: {
    title: '博客',
    description: '动手做东西时记下的笔记：预约系统的正确性、3D 性能，还有学校项目真正教会我的事。',
  },

  index: {
    heading: (accent) => <>开发{accent('手记')}</>,
    lede: '有些事是吃了亏才弄明白的，趁细节还记得清楚，赶紧写下来。写的大多是 bug——那才是值得一读的部分。',
    empty: '还没有文章，过段时间再来看看。',
  },

  readingTime: (minutes) => `${minutes} 分钟阅读`,
  draft: '草稿',

  untranslated: {
    badge: '英文',
    notice: '这篇文章暂时只有英文版。',
  },

  post: {
    allWriting: '全部文章',
    previous: '上一篇',
    next: '下一篇',
    cta: '也在做类似的东西，或者想找人聊聊？',
  },
};

export const blogDict: Record<Locale, typeof en> = { en, zh };
