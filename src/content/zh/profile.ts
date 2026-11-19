import { marqueeTerms as marqueeTermsEn, profile as en } from '../profile';
import type { HeadlineStat, Profile } from '../types';

/**
 * The profile, in Chinese.
 *
 * Only the prose is restated. Name, email, photo, résumé path and timezone are
 * spread in from the English object, so the two can never drift apart on a fact.
 *
 * The name stays in Latin script on purpose. A romanised surname maps to several
 * different characters, and a guessed Chinese name on someone's own portfolio
 * would be worse than none.
 */
export const profile: Profile = {
  ...en,
  role: '初级软件工程师',
  tagline: '全栈开发者，也做 UX 设计。',
  location: '新加坡',
  bio: [
    '从界面，到界面背后的 API，再到决定这两者该做什么的用户研究，我都自己来。目前在南洋理工学院修读资讯科技专业文凭，专攻全栈开发与数字用户体验设计。',
    '做 CertAIn 的时候，我主持了一场 9 人参与的可用性测试。其中 5 人被一个地图弹窗卡住了——它正好盖住了他们要找的路线。开发期间我们谁都没发现这个问题，因为我们早就知道路线在哪里。所以测试要找陌生人来做；也正因为这样，我现在把用户测试当成开发的一部分，而不是开发完成后的一道工序。',
    '最近的一件事：在 2026 年的 NYP × AWS 黑客松上拿了冠军——SmartRecap 的整个前端，是我一个通宵写完的。我正在找 2027 年在新加坡的软件工程实习。',
  ],
  facts: [
    { label: '学历', value: '资讯科技专业文凭 · NYP' },
    { label: '专业方向', value: '全栈开发与数字用户体验设计' },
    { label: '毕业年份', value: '2028' },
    { label: '语言', value: '英语、华语' },
  ],
  exploring: ['React', 'Next.js', '有出处的 AI 界面', '设计系统'],
  socials: en.socials.map((social) => (social.icon === 'mail' ? { ...social, label: '邮箱' } : social)),
};

/** Thought bubbles above the avatar. Short, for the same reason as in English. */
export const avatarThoughts: readonly string[] = [
  '在找 2027 年的实习 👀',
  '想聊聊 SmartRecap 吗？',
  'NYP × AWS 2026 冠军',
  '本站已开源',
  '拖一拖下面的工牌 ↓',
  '全站从零手写',
];

/** The two halves of the specialisation, cycling in the hero sub-line. */
export const heroRotation: readonly string[] = ['全栈开发', '数字用户体验设计'];

/** Technology names are not translated; only the one plain-language term is. */
export const marqueeTerms: readonly string[] = marqueeTermsEn.map((term) =>
  term === 'USABILITY TESTING' ? '可用性测试' : term,
);

export const headlineStats: readonly HeadlineStat[] = [
  { value: 6, suffix: '', label: '已交付项目' },
  { value: 30, suffix: '+', label: '用过的技术' },
  { value: 7, suffix: '', label: '奖项与证书' },
  { value: 2028, suffix: '', label: '毕业年份' },
];
