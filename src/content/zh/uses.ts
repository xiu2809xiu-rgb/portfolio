import type { UsesCategory } from '../types';
import { usesCategories as en } from '../uses';

export * from '../uses';

export const usesIntro =
  '这里列的是我每天真的会打开的工具，不是一份“以后想用”的清单。谁上榜、谁出局，随时更新。';

interface CategoryInChinese {
  readonly name: string;
  /**
   * Keyed by the entry's English name. `name` is given only where the English
   * one is a description ("Wired earbuds") rather than a product or a key
   * combination, which read the same in both languages.
   */
  readonly entries: Readonly<Record<string, { readonly name?: string; readonly note: string }>>;
}

/**
 * The list, in Chinese — keyed by the English category and entry names rather
 * than written out as a second array.
 *
 * This page changes whenever a tool earns or loses its place, and a parallel
 * array would have to be edited in step every time. Laid over the English list
 * instead, the two cannot disagree about which tools there are or what order
 * they come in: a tool added in English shows up here at once, with its English
 * note until a line is written for it below, and one removed there disappears
 * from both.
 */
const zh: Readonly<Record<string, CategoryInChinese>> = {
  'Editor & terminal': {
    name: '编辑器与终端',
    entries: {
      'Visual Studio Code': { note: '主力编辑器。Dark+ 主题，Fira Code 字体，开着连字。' },
      'Claude Code': { note: '终端里的结对编程搭档，重构和搭脚手架都找它。' },
      'Windows Terminal + Git Bash': { note: '用着 Windows，敲的还是 POSIX 那一套。' },
      'GitHub Desktop': { note: '提交之前，用它直观地过一遍 diff。' },
    },
  },
  'Languages & frameworks': {
    name: '语言与框架',
    entries: {
      'Python + Flask': { note: '我用得最顺手的一套。Blueprints、SQLAlchemy、Jinja2。' },
      'TypeScript + Next.js': { note: '这个网站就是用这一套搭的。2026 年正在把它系统地学一遍。' },
      'Tailwind CSS': { note: '设计令牌集中在一处，不用再去样式表里考古。' },
      'PostgreSQL / MySQL': { note: '默认用关系型数据库。先想表结构，再考虑文档数据库。' },
    },
  },
  'Design & planning': {
    name: '设计与规划',
    entries: {
      Figma: { note: '写代码之前，先在这里画线框图和组件草图。' },
      Excalidraw: { note: '当白板用，画架构图和数据流。' },
      Notion: { note: '课程笔记、项目说明，还有一份越记越长的阅读清单。' },
    },
  },
  Hardware: {
    name: '硬件',
    entries: {
      'Windows 11 laptop': {
        name: 'Windows 11 笔记本电脑',
        note: '主力机，功课和业余项目都靠它。',
      },
      'External 1080p monitor': {
        name: '1080p 外接显示器',
        note: '笔记本屏幕放编辑器，副屏放浏览器和文档。',
      },
      'Wired earbuds': { name: '有线耳机', note: '不用配对，不用充电，没有借口。' },
    },
  },
  'Shortcuts worth stealing': {
    name: '值得偷师的快捷键',
    entries: {
      'Ctrl + P': { note: '模糊搜索打开文件。文件树我几乎不碰。' },
      'Ctrl + Shift + L': { note: '选中所有匹配项，一次改完。' },
      'Alt + ↑ / ↓': { note: '上下移动一行，不用剪切粘贴。' },
      F2: { note: '在整个项目里安全地重命名符号。' },
    },
  },
};

export const usesCategories: readonly UsesCategory[] = en.map((category) => {
  const translated = zh[category.name];
  if (!translated) return category;

  return {
    ...category,
    name: translated.name,
    entries: category.entries.map((entry) => ({ ...entry, ...translated.entries[entry.name] })),
  };
});
