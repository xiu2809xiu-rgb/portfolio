import type { Locale } from '../config';

/**
 * Strings for the parts of the site that are on every page: the document head,
 * the header, the footer and the 404.
 *
 * Every dictionary in this folder has the same shape. `en` is written out in
 * full and `zh` is typed as `typeof en`, so a key added to one language and
 * forgotten in the other fails to compile instead of rendering as a blank.
 * Where a sentence has a hole in it, the entry is a function rather than a
 * template with a placeholder — word order differs between the two languages,
 * and a function lets each put the variable where it actually belongs.
 *
 * The Chinese is written, not converted: the same facts in the register a
 * Chinese-speaking developer would use on their own site. Product names, tools
 * and the name "Richie Koh" stay in Latin script.
 */

const en = {
  skipToContent: 'Skip to content',
  /** A short duration, as shown beside a post: "4 min". */
  minutes: (count: number) => `${count} min`,

  /** Screen-reader names for the toast region and a toast's close button. */
  toast: {
    region: 'Notifications',
    close: 'Close toast',
  },

  site: {
    /** `<title>` on the home page, and the default share-card title. */
    name: (fullName: string, role: string) => `${fullName} — ${role}`,
    description:
      'Full-stack developer and UX designer at Nanyang Polytechnic. First place at the NYP × AWS Hackathon 2026. Case studies, writing, and a calendar you can book directly. Seeking a 2027 software engineering internship in Singapore.',
    keywords: [
      'Richie Koh',
      'Koh Shan Shun',
      'software developer portfolio',
      'Nanyang Polytechnic',
      'Singapore developer',
      'Flask developer',
      'Next.js portfolio',
      'full-stack developer',
      'UX design',
      'software engineering internship',
      'SmartRecap',
    ],
    rssTitle: (fullName: string) => `${fullName} — Writing`,
    manifestDescription: 'Portfolio, case studies, writing, and a calendar you can book.',
  },

  header: {
    homeAria: (fullName: string) => `${fullName} — home`,
    rebuild: 'Rebuild the site',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    drive: 'Drive',
    book: 'Book me',
    bookSession: 'Book a session',
    driveCardTitle: 'Take the car out',
    driveCardMeta: 'A drivable world · loads only if you ask',
  },

  /**
   * The language switch. Its label names the language it leads to, in that
   * language, so `en` here holds Chinese text and vice versa — someone who
   * cannot read the current page has to be able to read the way out of it.
   */
  languageSwitch: {
    label: '中文',
    aria: '切换到中文',
  },

  footer: {
    blurb: (role: string, location: string) =>
      `${role} in ${location}. Currently open to internships and collaborations.`,
    navAria: 'Footer',
    site: 'Site',
    elsewhere: 'Elsewhere',
    detours: 'Detours',
    builtWith: (year: number, name: string) =>
      `© ${year} ${name}. Built with Next.js, Three.js, and too much tea.`,
    available: 'Available for work',
  },

  notFound: {
    metaTitle: 'Page not found',
    metaDescription: 'That page does not exist.',
    heading: 'This page doesn’t exist',
    body: 'The link may be out of date, or I may have moved something. Here is everything that does exist:',
    backHome: 'Back home',
  },
};

const zh: typeof en = {
  skipToContent: '跳到正文',
  minutes: (count) => `${count} 分钟`,

  toast: {
    region: '通知',
    close: '关闭通知',
  },

  site: {
    name: (fullName, role) => `${fullName} — ${role}`,
    description:
      '南洋理工学院在读的全栈开发者，也做 UX 设计；2026 年 NYP × AWS 黑客松冠军。这里有项目案例、技术文章，还有一份可以直接预约的日历。正在寻找 2027 年在新加坡的软件工程实习机会。',
    keywords: [
      'Richie Koh',
      'Koh Shan Shun',
      '软件开发作品集',
      '南洋理工学院',
      '新加坡开发者',
      '全栈开发',
      'UX 设计',
      '软件工程实习',
      'Flask',
      'Next.js',
      'SmartRecap',
    ],
    rssTitle: (fullName) => `${fullName} 的文章`,
    manifestDescription: '作品集、项目案例、技术文章，还有一份可以直接预约的日历。',
  },

  header: {
    homeAria: (fullName) => `${fullName}，回到首页`,
    rebuild: '重启本站',
    openMenu: '打开菜单',
    closeMenu: '关闭菜单',
    drive: '兜风',
    book: '预约',
    bookSession: '约个时间聊聊',
    driveCardTitle: '开车兜风',
    driveCardMeta: '一个能开车的小世界 · 点了才加载',
  },

  languageSwitch: {
    label: 'EN',
    aria: 'Switch to English',
  },

  footer: {
    blurb: (role, location) => `常驻${location}的${role}。正在找实习，也欢迎合作。`,
    navAria: '页脚导航',
    site: '站内',
    elsewhere: '其他平台',
    detours: '题外话',
    builtWith: (year, name) => `© ${year} ${name} · 用 Next.js、Three.js 搭建，外加一杯接一杯的茶。`,
    available: '欢迎工作邀约',
  },

  notFound: {
    metaTitle: '页面不存在',
    metaDescription: '这个页面不存在。',
    heading: '这个页面不存在',
    body: '链接可能过期了，也可能是我把页面挪走了。下面这些都还在：',
    backHome: '回到首页',
  },
};

export const commonDict: Record<Locale, typeof en> = { en, zh };
