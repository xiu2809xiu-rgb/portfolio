import type { SellLine, Segment } from '../hard-sell';

/*
  The stage boundaries, `lineText` and `stageFor` come straight through from the
  English module: the dial has the same fifty positions in both languages and
  changes regime at the same places.
*/
export * from '../hard-sell';

const to = (text: string, href: string): Segment => ({ text, href });

/**
 * The fifty pitches, in Chinese.
 *
 * Rewritten rather than translated, because a joke translated word for word
 * stops being one. The low end is as flat as the English; the loud end borrows
 * the clichés of Chinese television shopping — 现货供应, 现在下单加送, 亲测 —
 * which a Chinese reader recognises instantly, the way an English one
 * recognises "ACT NOW".
 *
 * What does not move: every claim is the same claim, with the same numbers, and
 * every link points at the same page as the English line in the same position.
 * Shouting needs no capital letters here — the page already sets the loud
 * stages in its heaviest weight, so the volume comes from the wording.
 *
 * Where a link sits next to a digit or a Latin word, the space between them is
 * inside the plain segment, so the rendered line is spaced correctly.
 */
export const hardSellLines: readonly SellLine[] = [
  // ── 1–8 · deadpan ────────────────────────────────────────────────────────
  ['嗯，我是写软件的。那又怎样？'],
  ['Richie。全栈。新加坡。推销完毕。'],
  ['我做 Web 开发。你可以接着忙你的了。'],
  ['有个', to('作品集', '/work'), '，就在那儿。看不看随你。'],
  ['我是软件开发者。我写的软件，有一部分是能跑的。'],
  ['2027 年可以来实习——如果你们正好需要的话。'],
  ['不打算吹。', to('作品', '/work'), '点一下就能看到。'],
  ['南洋理工学院，资讯科技专业文凭，2028 年毕业。'],

  // ── 9–16 · mildly self-aware ─────────────────────────────────────────────
  ['我好像应该提一句：最近拿了个奖。'],
  ['拿的是 ', to('2026 年 NYP × AWS 黑客松', '/work/smartrecap'), '冠军。随口一提而已。'],
  ['5 个', to('已交付的项目', '/work'), '。为了确认，我数了两遍。'],
  ['前端、后端，还有夹在两者之间的 ', to('UX 决策', '/#skills'), '。'],
  ['我曾经一个晚上写了 25 个页面组件。故意的。'],
  ['通宵赶出来的', to('那个项目', '/work/smartrecap'), '拿了第一。如果有人在算分的话。'],
  ['有人在算。'],
  ['20 多种技术，6 个', to('奖项与证书', '/#achievements'), '。还在继续数。'],

  // ── 17–24 · actually selling now ─────────────────────────────────────────
  ['直说吧：这份工作，我能做好。'],
  [to('SmartRecap', '/work/smartrecap'), ' 给出的每个说法，都会标明出自哪一张幻灯片。要的就是这个。'],
  ['它的整个前端都是我写的，每一个组件都是。'],
  [to('CertAIn', '/work/certain'), ' 的 SUS 平均分是 74.2，测试参与者共 9 位。'],
  ['那场', to('测试', '/work/certain'), '是我亲自主持的：现场引导，出声思维，3 个场景。'],
  ['9 个用户里有 5 个，被一个团队里谁都没注意到的弹窗卡住了。'],
  ['找出这种问题，才是正经活儿。一路顺利的流程，谁都做得出来。'],
  ['Flask、React、TypeScript、Next、Postgres、three.js。', to('技术栈随你挑', '/#skills'), '。'],

  // ── 25–32 · keen ─────────────────────────────────────────────────────────
  ['你还在往下看。这对我们俩来说，都是个好兆头。'],
  [
    '12 个路由，6 张表，15 条校验规则——全都',
    to('放在服务器端', '/work/singink-support'),
    '，在那儿才算数。',
  ],
  ['这个网站能', to('在真日历上约真会议', '/book'), '。不信你试试。'],
  [to('这个网站上的车', '/drive'), '装了能用的悬挂。我实在没忍住。'],
  ['我会', to('把自己做错的事写下来', '/blog'), '。清单很短。据说。'],
  ['我宁愿交付一个实打实的功能，也不要五个还得解释半天的。'],
  ['录用我，你的点子有问题时，我会直说。很礼貌地说。'],
  ['爱问“为什么”的实习生，比事后收拾烂摊子的工程师便宜多了。'],

  // ── 33–40 · infomercial ──────────────────────────────────────────────────
  ['现货供应！新加坡！2027 年实习！一句话的事！'],
  ['亲测能', to('拿黑客松冠军', '/work/smartrecap'), '！亲测能', to('做用户研究', '/work/certain'), '！亲测能交付！'],
  ['现在下单，加送一位亲手写提交信息的开发者！'],
  ['没错！完整的句子！主谓宾齐全！还写清了为什么！'],
  ['别的候选人只发一份 PDF！我直接给你', to('一整个网站', '/'), '！'],
  ['带', to('预约系统', '/book'), '！带', to('物理引擎', '/drive'), '！还带', to('博客', '/blog'), '！'],
  ['隔壁团队已经在看这一页了！大概吧！'],
  ['这个险，你冒得起吗？冒得起吗？'],

  // ── 41–46 · unhinged ─────────────────────────────────────────────────────
  ['快约！日历就在那儿！不要钱！'],
  ['我把日程全清空了！好吧，本来就是空的！'],
  ['冠军！NYP × AWS 2026！我还要再说一百遍！'],
  ['七十四点二！货真价实的 SUS 分数！不信去查！'],
  ['二十五个组件！一个晚上！十六个半小时！'],
  ['我一夜没睡，我们赢了，再来一次我还这么干！'],

  // ── 47–50 · total collapse ───────────────────────────────────────────────
  ['发邮件给我！约我！按钮已经超大了！是我故意弄这么大的！'],
  ['项目在满屏乱飞！全是真作品！快看！'],
  ['录用 Richie！录用 Richie！录用 Richie！录用 Richie！'],
  ['录用 Richie Koh'],
];

/** The marquee. Same facts as the English strip, in the same order. */
export const shoutingPoints: readonly string[] = [
  'NYP × AWS 黑客松 2026 · 冠军',
  'SUS 平均分 74.2',
  '16.5 小时写完 25 个页面组件',
  '2027 年可来实习',
  '5 个已交付项目',
  '全栈与 UX',
  '新加坡',
];

/** The reels that fly past, with their captions in Chinese. */
export const flyingWork: readonly { title: string; src: string; href: string }[] = [
  { title: 'SmartRecap', src: '/video/work/smartrecap.mp4', href: '/work/smartrecap' },
  { title: 'Singink', src: '/video/work/singink-support.mp4', href: '/work/singink-support' },
  {
    title: '乒乓球 CCA',
    src: '/video/work/table-tennis-cca-website.mp4',
    href: '/work/table-tennis-cca-website',
  },
];
