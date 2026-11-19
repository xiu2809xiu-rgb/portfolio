import type { Locale } from '../config';

/**
 * Strings for the chrome that is on every page but is neither header nor
 * footer: the command palette, the sound control, the reboot sequence, and the
 * labels the dialog primitives fall back to.
 *
 * Same shape as `common.ts`, and the same rule for the Chinese: written, not
 * converted. The names of the pages the palette lists are not repeated here —
 * they are read from the navigation, so the palette can never call a page
 * something the header does not.
 */

const en = {
  /**
   * What the shadcn primitives say when a caller gives them nothing of its own:
   * the close button of a dialog or sheet, and a command dialog's title and
   * description for screen readers.
   */
  primitives: {
    close: 'Close',
    commandTitle: 'Command Palette',
    commandDescription: 'Search for a command to run...',
  },

  palette: {
    open: 'Open command palette',
    title: 'Command palette',
    description: 'Search and jump anywhere on this site',
    placeholder: 'Jump to a page, project, or post…',
    empty: 'Nothing matches that.',
    /** Screen-reader name of the list under the input. */
    results: 'Suggestions',

    groups: {
      goTo: 'Go to',
      caseStudies: 'Case studies',
      writing: 'Writing',
      actions: 'Actions',
    },

    copyEmail: 'Copy email',
    downloadResume: 'Download résumé',
    rssFeed: 'RSS feed',
    sendEmail: 'Send an email',

    emailCopied: 'Email address copied',
    copyFailed: 'Could not copy',
    copyFailedDetail: 'Your browser blocked clipboard access.',

    /**
     * Words each fixed entry answers to, beyond its label.
     *
     * The one thing in a dictionary that is not picked by the page's language:
     * the palette matches every entry against both lists at once. Someone who
     * reads both languages types whichever word comes to mind first, so `作品`
     * has to find Work on the English site and `work` has to find 作品 on the
     * Chinese one.
     */
    search: {
      home: 'home start',
      work: 'work projects case studies',
      blog: 'blog writing posts articles',
      uses: 'uses tools setup gear stack',
      book: 'book schedule calendar meeting call',
      drive: 'drive car game 3d physics play explore town',
      pitch: 'pitch hard sell slider hire me joke',
      copyEmail: 'copy email address contact',
      resume: 'resume cv download pdf',
      rss: 'rss feed subscribe',
      github: 'github code repos source',
      linkedin: 'linkedin profile professional',
      sendEmail: 'email mail write message',
    },
  },

  audio: {
    muteSfx: 'Mute interface sounds',
    unmuteSfx: 'Unmute interface sounds',
    pauseMusic: 'Pause music',
    playMusic: 'Play background music',
    nextTrack: 'Next track',
    blocked: 'Playback was blocked',
    blockedDetail:
      'Your browser refused to start audio. Low Power Mode on iOS is the usual cause.',
  },

  reboot: {
    /** The overlay's name for a screen reader. The log itself is in `content/reboot.ts`. */
    label: 'Rebuilding the site',
    skip: 'Click anywhere to skip',
  },
};

const zh: typeof en = {
  primitives: {
    close: '关闭',
    commandTitle: '命令面板',
    commandDescription: '搜索要运行的命令……',
  },

  palette: {
    open: '打开命令面板',
    title: '命令面板',
    description: '搜索并跳转到本站任意位置',
    placeholder: '跳转到页面、项目或文章……',
    empty: '没有匹配的结果。',
    results: '搜索结果',

    groups: {
      goTo: '前往',
      caseStudies: '项目案例',
      writing: '文章',
      actions: '操作',
    },

    copyEmail: '复制邮箱',
    downloadResume: '下载简历',
    rssFeed: 'RSS 订阅',
    sendEmail: '发邮件',

    emailCopied: '邮箱地址已复制',
    copyFailed: '复制失败',
    copyFailedDetail: '浏览器不允许访问剪贴板。',

    /*
      Chinese only, each word set off by a space so it scores as the start of a
      word. Anything in Latin script belongs in the English list above, which is
      matched on this site too — repeating it here would only skew the ranking.
    */
    search: {
      home: '首页 主页 开始',
      work: '作品 项目 案例',
      blog: '博客 文章 写作',
      uses: '工具 配置 装备 技术栈',
      book: '约个时间聊聊 预约 日历 会议 通话',
      drive: '开车 兜风 游戏 物理 探索 小镇',
      pitch: '毛遂自荐 推销 滑块 招我 玩笑',
      copyEmail: '复制 邮箱 地址 联系',
      resume: '下载 简历 履历',
      rss: '订阅 更新',
      github: '代码 仓库 源码',
      linkedin: '领英 职业 档案',
      sendEmail: '发邮件 邮箱 写信 留言',
    },
  },

  audio: {
    muteSfx: '关闭界面音效',
    unmuteSfx: '开启界面音效',
    pauseMusic: '暂停音乐',
    playMusic: '播放背景音乐',
    nextTrack: '下一首',
    blocked: '播放被拦截了',
    blockedDetail: '浏览器拒绝播放音频，多半是因为 iOS 开了低电量模式。',
  },

  reboot: {
    label: '正在重启本站',
    skip: '点击任意位置跳过',
  },
};

export const chromeDict: Record<Locale, typeof en> = { en, zh };
