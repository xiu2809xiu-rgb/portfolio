import * as en from '../resume';
import type { Achievement, ExperienceEntry, ProcessStep, SkillGroup, Testimonial } from '../types';

/**
 * The résumé, in Chinese.
 *
 * Only what a person reads is restated. Periods, years, icons, the avatar path
 * and the `featured` / `minor` flags are spread in from the English entries, so
 * a fact is corrected in one place and the two languages cannot disagree on it.
 *
 * Three kinds of name stay in Latin script on purpose:
 *
 *   · technologies, which are searched for and recognised in that spelling;
 *   · a certificate issued by a company — its title is what is printed on the
 *     certificate and what anyone checking it would look up, so only the
 *     description beside it is translated;
 *   · people, companies and the hackathon team.
 *
 * Course names are the opposite case. They describe a subject rather than
 * identify a document, so they are translated.
 */

/*
  Every name the English module exports is redefined below, so today this line
  forwards nothing. It is there for a name added to the English file later,
  which then renders in English here until its translation is written, instead
  of breaking the build.
*/
export * from '../resume';

/**
 * The English entry that a Chinese one is laid over.
 *
 * Found by the value of a field rather than by position, so an entry added to
 * or moved within the English list cannot leave a translation sitting under
 * someone else's dates. A miss throws: spreading `undefined` is legal, and the
 * result would be a card with its Chinese text and no icon or period, which is
 * far easier to publish by accident than a build that fails.
 */
function englishEntry<T, K extends keyof T>(entries: readonly T[], key: K, value: T[K]): T {
  const entry = entries.find((candidate) => candidate[key] === value);
  if (!entry) {
    throw new Error(`zh/resume: no English entry whose ${String(key)} is "${String(value)}"`);
  }
  return entry;
}

/**
 * The skills that are ordinary words rather than product names.
 *
 * Every group's list goes through this, so a technology added to the English
 * file shows up here as it is, without this file being touched. Only a new
 * plain-language skill needs a line.
 */
const plainSkills: ReadonlyMap<string, string> = new Map([
  ['Schema design', '表结构设计'],
  ['Normalisation', '数据库规范化'],
  ['REST APIs', 'REST API'],
  ['Session & token auth', '会话与令牌认证'],
  ['Agile & Scrum', '敏捷开发与 Scrum'],
  ['User stories', '用户故事'],
  ['Test planning', '测试计划'],
  ['Usability testing', '可用性测试'],
  ['Journey mapping', '用户旅程图'],
  ['Personas', '用户画像'],
  ['Hypothesis testing', '假设检验'],
]);

const group = (name: string): SkillGroup => {
  const base = englishEntry(en.skillGroups, 'name', name);
  return { ...base, items: base.items.map((item) => plainSkills.get(item) ?? item) };
};

export const skillGroups: readonly SkillGroup[] = [
  { ...group('Languages'), name: '编程语言', blurb: '写代码时最先想到的。' },
  { ...group('Frontend'), name: '前端', blurb: '用户真正摸得着的那部分。' },
  { ...group('Backend'), name: '后端', blurb: '路由、认证，还有背后的数据。' },
  { ...group('Data'), name: '数据库', blurb: '表结构、查询和存储。' },
  { ...group('Cloud & DevOps'), name: '云与 DevOps', blurb: '东西是怎么交付出去的。' },
  { ...group('Testing & research'), name: '测试与用户研究', blurb: '检验成果——靠工具，也靠人。' },
];

/** NYP module names, in the order the English file lists them. */
const courseNames: ReadonlyMap<string, string> = new Map([
  ['Full Stack Application Development', '全栈应用开发'],
  ['Digital User Experience Design', '数字用户体验设计'],
  ['Agile Development Process with DevOps', '敏捷开发流程与 DevOps'],
  ['Data Structures & Algorithms', '数据结构与算法'],
  ['Cloud Computing', '云计算'],
  ['Database Design & Administration', '数据库设计与管理'],
  ['Statistical Research Methods', '统计研究方法'],
  ['Cybersecurity Technologies & Ethics', '网络安全技术与伦理'],
]);

/*
  Two parts of an entry are not prose, and are put into Chinese here for every
  entry rather than in each one: a role that is still running has a word in its
  period, and course names go through the table above. An entry added later
  gets both without anyone having to remember.
*/
const role = (title: string): ExperienceEntry => {
  const base = englishEntry(en.experience, 'title', title);
  return {
    ...base,
    period: base.period.replace('Present', '至今'),
    ...(base.coursework && {
      coursework: base.coursework.map((course) => courseNames.get(course) ?? course),
    }),
  };
};

export const experience: readonly ExperienceEntry[] = [
  {
    ...role('Diploma in Information Technology'),
    title: '资讯科技专业文凭',
    organisation: '南洋理工学院',
    description:
      '专攻全栈开发与数字用户体验设计。2026/27 学年第一学期名列院长荣誉榜（Director’s List），学期 GPA 4.0，数据结构与算法、商业创新与创业两门课获特优（Distinction）。',
  },
  {
    ...role('Private Tutor — Mathematics & Chinese'),
    title: '私人补习老师 · 数学与华文',
    organisation: '独立授课 · 新加坡',
    description:
      '教过 10 多名程度不一的学生，每节课都围绕学生最薄弱的环节来备，而不是照着固定的教学大纲走。讲完要确认对方是真的听懂了，而不是想当然——这个习惯，也正是可用性测试管用的原因。',
  },
  {
    ...role('Assistant Class Representative'),
    title: '副班长',
    organisation: '南洋理工学院 · 资讯科技学院',
    description: '由同学推选，负责 30 多名同学与讲师之间的沟通，有问题随时协调解决。',
  },
  {
    ...role('Overseas Education & Learning Programme (OELP-ACI)'),
    title: '海外教育与学习计划（OELP-ACI）',
    organisation: '南洋理工学院',
    description: '完成了南洋理工学院赴亚细安（东盟）、中国和印度的海外教育与学习计划。',
  },
];

/** 立德中学 is the school's own Chinese name, not a translation of "Riverside". */
export const earlierExperience =
  '更早之前：在立德中学（Riverside Secondary School）机器人俱乐部担任执行委员，摆弄过 Scratch、面包板和 LEGO Mindstorms，还拿过一个 First LEGO League 参与奖。';

const step = (index: string) => englishEntry(en.processSteps, 'index', index);

/**
 * Each step keeps the two halves the English has: the principle in `body`, and
 * in `evidence` the instance that shows the principle was actually followed.
 */
export const processSteps: readonly ProcessStep[] = [
  {
    ...step('01'),
    title: '调研',
    body: '动手设计之前，先弄清楚用户实际在做什么、真正的约束是什么——别让设计围着猜测转。',
    evidence:
      'CertAIn 做成离线优先，是因为活动会场恰恰最容易断网。这是一开始就摸清的约束，不是后来才加上去的功能。',
  },
  {
    ...step('02'),
    title: '设计',
    body: '先做线框图和高保真原型。在 Figma 里挪个按钮很便宜；等 3 个页面都依赖它原来的位置了，再挪就贵多了。',
    evidence:
      '测试用户流程之前，CertAIn 的高保真原型就已经在 Figma 里做好了——有了它，才谈得上测试。',
  },
  {
    ...step('03'),
    title: '开发',
    body: '做出能跑的软件，期限容得下多少就做多少。决定不做什么，本身也是开发的一部分。',
    evidence:
      'SmartRecap：25 个页面组件、引用阅读器、3D 流水线导览和会话管理，一个通宵做完——因为我们看错了日程。',
  },
  {
    ...step('04'),
    title: '测试',
    body: '找陌生人来测，让他们边用边说。自己做的界面，自己是看不清的：东西都在哪里，你早就知道了。',
    evidence:
      '9 名参与者、3 个场景、SUS 平均分 74.2——还有一个盖住路线的地图弹窗，卡住了其中 5 人，而我们开发时谁都没发现。',
  },
  {
    ...step('05'),
    title: '交付',
    body: '拿出去给人用，是什么状态就直说。把话说在前头的演示，胜过悄悄出故障的演示。',
    evidence:
      '黑客松的 AWS 环境到期后，SmartRecap 的在线演示就跑在免费套餐上了。这一点项目案例里写明了，没让访客自己从第一次慢吞吞的加载里去猜。',
  },
];

const award = (title: string) => englishEntry(en.achievements, 'title', title);

export const achievements: readonly Achievement[] = [
  {
    ...award('1st Place — NYP × AWS Hackathon'),
    title: 'NYP × AWS 黑客松 · 冠军',
    organisation: '南洋理工学院 × AWS',
    body: '赛题 1：课堂回顾自动生成器。我和 Stay Grounded 队的另外 3 名队友做出了 SmartRecap；我是前端负责人，整个前端是我一个通宵写完的。',
  },
  {
    ...award('Director’s List'),
    title: '院长荣誉榜',
    organisation: '南洋理工学院',
    body: '2026/27 学年第一学期，学期 GPA 4.0；数据结构与算法、商业创新与创业两门课获特优。',
  },
  {
    ...award('Python Hackathon — RGB Face Filter'),
    /* A Chinese company, which Chinese readers know by its Chinese name. */
    organisation: '商汤科技（SenseTime）',
    body: '计算机视觉实战：用 Python 写了一个 RGB 人脸滤镜。',
  },
  {
    ...award('AI Fluency: Framework & Foundation'),
    body: '负责任的 AI 开发框架，以及 AI 在现代软件中的实际应用。',
  },
  {
    ...award('UX Design Fundamentals'),
    body: '把用户研究、线框图和评估当作一门学问，而不是一道工序。',
  },
  {
    ...award('Web Development Basics (MDLPT-268)'),
    body: 'HTML、CSS、JavaScript，以及现代开发工作流。',
  },
  {
    ...award('Assistant Class Representative'),
    title: '副班长',
    organisation: '南洋理工学院',
    body: '由同学推选，负责 30 多名同学与讲师之间的沟通协调。',
  },
  {
    ...award('Hackathon — 4th Place'),
    title: '黑客松 · 第 4 名',
    organisation: '校级比赛',
    body: '在很紧的时间里做出了能跑的原型。',
  },
];

/**
 * Someone else's words, so this is a translation and not a rewrite: nothing
 * added, nothing sharpened.
 */
export const testimonials: readonly Testimonial[] = [
  {
    ...englishEntry(en.testimonials, 'name', 'Rihan Iqbal'),
    quote:
      'Richie 一向很注重细节，也真心愿意帮助队友。他做的工单系统，是我们这一届里打磨得最好的作品之一。',
    title: '队友 · Singink，以及 NYP × AWS 2026 的 SmartRecap',
  },
];
