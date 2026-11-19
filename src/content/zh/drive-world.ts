import { districts as en, type District } from '../drive-world';

/*
  Geometry is not restated. The constants, the gate maths and `onRoad` come
  straight through from the English module, so the map is laid out once and both
  languages drive on the same tarmac. `onRoad` and `inDistrict` read only
  bearings and radii, which are spread in below unchanged — a second copy of
  either would be a second chance for a tree to grow through a road.
*/
export * from '../drive-world';

const base = (id: string) => en.find((district) => district.id === id)!;

/**
 * The six chapters, in Chinese.
 *
 * Only what the HUD prints is restated: the name, the line above it and the
 * line below. Project names stay as they are written everywhere else on the
 * site, so two of the six keep their English name outright.
 *
 * The boards over the gates are painted from the English list on purpose —
 * they are part of the world rather than part of the interface, and the 3D
 * components keep importing `../drive-world` directly.
 */
export const districts: readonly District[] = [
  {
    ...base('campus'),
    name: '南洋理工学院',
    kicker: '一切从这里开始',
    blurb: '资讯科技专业文凭，2028 年毕业。',
  },
  {
    ...base('arena'),
    kicker: '冠军 · NYP × AWS 2026',
    blurb: '一个通宵，写了 25 个页面组件。结果拿了冠军。',
  },
  {
    ...base('studio'),
    kicker: 'SUS 平均分 74.2',
    blurb: '9 位参与者，3 个场景，还有 1 个弹窗，卡住了其中 5 人。',
  },
  {
    ...base('workshop'),
    name: 'Singink 与 SwapLah',
    kicker: 'Flask、工单、用户管理',
    blurb: '12 个路由，6 张表，15 条校验规则——都在服务器端，在那里才算数。',
  },
  {
    ...base('court'),
    name: '乒乓球社团',
    kicker: '从线框图到能用的成品',
    blurb: '这个社团原本只活在群聊里，现在有了自己的家。',
  },
  {
    ...base('lookout'),
    name: '打个招呼',
    kicker: '正在找 2027 年的实习',
    blurb: '这后面连着一份真日历。挑个时段吧。',
  },
];
