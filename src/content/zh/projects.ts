import { projects as en } from '../projects';
import type { Project } from '../types';

/**
 * The case studies, in Chinese.
 *
 * Only what a reader sees is restated. Slugs, images, preview reels, links,
 * metric values and the code samples come from the English entries, so a fact
 * is corrected in one place and the two languages cannot disagree on it. The
 * code samples stay exactly as they were shipped, English comments and error
 * strings included.
 *
 * Product names keep their Latin spelling, and so do technologies, course codes
 * and people. Course names are translated. Inside a sentence they sit in 《》, so
 * they read as titles rather than as descriptions; standing alone as the
 * `module` line they are already a label and need no marks. The one project
 * named in ordinary words, the table tennis club, is called what the drive map
 * calls it.
 */

/*
  `projects`, `getProject` and `featuredProjects` are all redefined below, which
  shadows them here. The star export is for a name added to the English module
  later: it shows up in English on the Chinese site until it is translated,
  instead of failing the build.
*/
export * from '../projects';

/**
 * The English case study a Chinese one is laid over.
 *
 * A miss throws. Spreading `undefined` is legal, and the result would be a page
 * with Chinese prose and no slug, images or metrics.
 */
function original(slug: string): Project {
  const project = en.find((candidate) => candidate.slug === slug);
  if (!project) throw new Error(`zh/projects: no English case study with the slug "${slug}"`);
  return project;
}

/**
 * Chinese text laid over an English list, item by item.
 *
 * Paired by position, because these lists have no key of their own and their
 * order is content: a walkthrough beat names its screenshot by index. Each
 * English item is spread underneath, so what the languages share — an image
 * path, a metric's value, which screenshot a beat shows — is written once. A
 * list that has gained or lost an entry on one side throws, rather than putting
 * a caption under the wrong image or a label beside the wrong number.
 */
function overlay<T extends object>(
  english: readonly T[] | undefined,
  chinese: readonly Partial<T>[],
): T[] {
  const items = english ?? [];
  if (items.length !== chinese.length) {
    throw new Error(`zh/projects: ${chinese.length} Chinese entries for a list of ${items.length}`);
  }
  return items.map((item, index) => ({ ...item, ...chinese[index] }));
}

const smartrecap = original('smartrecap');
const certain = original('certain');
const singink = original('singink-support');
const tableTennis = original('table-tennis-cca-website');
const swaplah = original('swaplah');
const abcRetail = original('abc-retail');

export const projects: readonly Project[] = [
  {
    ...smartrecap,
    titleAccent: '有出处的课堂回顾',
    role: '前端负责人——整个客户端都是我写的',
    module: 'NYP × AWS 黑客松 2026 · 赛题 1',
    term: '2026 年 8 月',
    award: '冠军',
    team: 'Stay Grounded 队——队友 Rihan Iqbal、Hong Yi Tan、Dillon Poh',
    summary:
      '把上课用的幻灯片、PDF 和 Word 文档变成结构清晰的课堂回顾和复习测验，每条内容都标明出自哪一页。',
    features: [
      '📎 导入幻灯片、PDF 和 DOCX',
      '🔗 引用精确到页',
      '🧪 自动生成复习测验',
      '🧭 3D 流水线导览',
      '🐍 浏览器里的 Python IDE',
      '⏲️ 闲置超时自动登出',
      '📄 25 个页面组件',
      '🚫 剔除无法溯源的内容',
    ],
    screenshots: overlay(smartrecap.screenshots, [
      { title: '首页' },
      { title: '引用阅读器' },
      { title: '复习功能' },
      { title: '登录' },
    ]),
    story: overlay(smartrecap.story, [
      {
        label: '问题',
        heading: '还得逐句核实的总结，算不上总结',
        body: '让模型总结一份课件，得到的是几段通顺的文字，可哪句话出自哪一页，根本看不出来——结果你还是得把课件重读一遍。赛题要做的是课堂回顾自动生成器，真正有意思的约束在于：输出要可靠到能取代课件，而不只是给课件当配角。',
      },
      {
        label: '规则',
        heading: '每一句都注明出自哪一页，否则就删掉',
        body: '回顾里的每一行，都能链接回它出自的那一页幻灯片。模型追溯不到来源的内容，还没到你面前就被删掉了，不会悄悄混进来冒充事实。所以它说的比普通的总结工具少——但说出来的每一句，都不用再拿课件去核对。SmartRecap 的首页把目标写得再直白不过：交到用户手上的无出处内容——零条。',
      },
      {
        label: '阅读器',
        heading: '点开引用去核对，读到哪里还在哪里',
        body: '阅读器是我做的：回顾的每一行都连着它的来源幻灯片，核实一句话只要点一下，不用回到原文件里翻来翻去。在这里，引用就是主要的交互，而不是一条脚注。',
      },
      {
        label: '让过程看得见',
        heading: '3D 导览，跟着真实的流水线走',
        body: '文档处理又慢又看不见，在用户眼里就跟坏了一样。我用 WebGL 做了一个导览，每个阶段都接在真实的后端流水线上：屏幕上显示的，就是任务实际走到的那一步，而不是一段靠猜的动画。',
      },
      {
        label: '练习',
        heading: '浏览器里的 Python IDE',
        body: '回顾和测验能告诉你漏了什么，却没给你练手的地方。所以客户端里嵌了一个 Python 编辑器，复习题可以直接写代码作答，不用只在选项里挑。',
      },
      {
        label: '约束',
        heading: '一个通宵，不是两天',
        body: '我们看错了日程，后来才发现没有两天，只能一口气做完——从周二下午 2 点一直做到周三早上 6 点半。25 个页面组件、引用阅读器、3D 导览和会话管理，都是在这段时间里做出来的。结果拿了冠军。',
      },
    ]),
    caseStudy: overlay(smartrecap.caseStudy, [
      {
        label: '背景与任务',
        body: '2026 年 NYP × AWS 黑客松的赛题 1，要求做一个课堂回顾自动生成器。最容易想到的做法，是把课件丢给模型、输出一份总结——可这样做出来的东西，学生还得对照原件逐行核实，大半价值也就没了。我们队把赛题读得更严：输出本身就必须信得过。',
      },
      {
        label: '我的做法',
        body: '前端全部由我负责：25 个页面组件；引用阅读器，把回顾的每一行连回来源幻灯片；3D WebGL 导览，接的是后端流水线的真实阶段，不是预先做好的动画；浏览器里的 Python 练习 IDE；还有会话管理，闲置 1 小时自动登出。我们原以为有两天，结果只有一个通宵——周二下午 2 点到周三早上 6 点半。',
      },
      {
        label: '成果',
        body: '拿了冠军。让它和普通总结工具拉开差距的，是那条溯源规则——要么注明出自哪一页，要么删掉。这也是我最不肯让步的一个决定：它让工具说得更少，但说出来的每一句都能一键核实。',
      },
    ]),
    metrics: overlay(smartrecap.metrics, [
      { label: '名次 · NYP × AWS 2026' },
      { label: '页面组件' },
      // The one value restated here: its unit is a word, and the word is English.
      { label: '开发时长', value: '16.5 小时' },
      { label: '团队人数' },
    ]),
    learnings: [
      '让输出句句有引用，首先是个产品决定，其次才是技术问题——它改变了这个工具可以说什么。',
      '展示流水线的真实阶段，比放一个转圈的加载图标强：知道自己在等什么，等待就显得没那么长。',
      '截止时间卡死的时候，定范围就是先决定不做什么，再把剩下的做扎实。',
      '整个前端都归一个人，哪里该保持一致就都得自己拿主意——分工的时候，这些决定是躲得开的。',
    ],
    links: overlay(smartrecap.links, [{ label: '在线演示' }, { label: '查看源码' }]),
    demoNote:
      '黑客松用的 AWS 环境已经到期了。现在的在线演示跑在 Vercel 和 Render 的免费套餐上，换了一个更轻量的模型；Render 闲置时会休眠，所以第一次加载大约要 1 分钟。',
  },
  {
    ...certain,
    titleAccent: '离线优先的签到系统',
    role: '全栈开发与 UX 研究',
    module: '全栈应用开发 · 企业客户项目',
    term: '2026 年 4 月至 8 月',
    summary:
      '为一家企业客户开发的活动签到系统，会场网络靠不住时照样能用——支持 NFC、二维码和设备端人脸签到，还有实时人数统计和会场地图。',
    features: [
      '📶 从一开始就离线优先',
      '💳 凸字 PVC NFC 卡',
      '🔳 二维码兜底',
      '🙂 设备端人脸签到',
      '📊 实时人数统计',
      '🔀 本地 / 云端引擎切换',
      '🗺️ 会场地图',
      '🎫 活动集章',
      '🧪 9 人可用性测试',
    ],
    caseStudy: overlay(certain.caseStudy, [
      {
        label: '背景与任务',
        body: 'CertAIn 是我在南洋理工学院《全栈应用开发》课上为一家企业客户做的项目：需求直接向客户收集，整个学期里还有几轮中期评审。活动会场恰恰是网络最靠不住的地方：大厅里挤满了人，网络是借来的，门口有没有信号全凭运气——一个得先连上云端才能放人进场的签到系统，偏偏会在最要命的时候出岔子。所以它从一开始就按离线优先来设计：用 NFC 卡和二维码识别身份，人脸识别在设备端跑，不放在服务器上。',
      },
      {
        label: '我的做法',
        body: '我负责全栈开发：后端用 Node.js 和 Sequelize，前端用 React，部署在 Azure App Service 上，做出了 NFC、二维码和设备端人脸签到，还有实时人数统计和会场地图。动手之前，我先在 Figma 里做了高保真原型；实体的部分也归我：通过一家海外供应商定制凸字 PVC NFC 卡，并备好可以直接付印的设计稿——留出血、文字转曲。之后在另一门课上，我评估了自己做的这套系统：找了 9 名参与者，由我主持做出声思维测试，用户画像设定为“对新技术有点犹豫的中小企业老板”，覆盖 3 个场景——NFC 签到、会场地图和活动集章。',
      },
      {
        label: '成果',
        body: '课程成绩 A。测试得到的 SUS 平均分是 74.2，但最要紧的发现却是一个失败：地图弹窗正好盖住了用户要找的路线，9 名参与者里有 5 人因此卡住。开发时我们谁都没注意到，因为我们早就知道路线在哪里。另外，有 4 名参与者没等我问，就主动说“活动集章”是他们最喜欢的功能。',
      },
    ]),
    metrics: overlay(certain.metrics, [
      { label: 'SUS 平均分' },
      { label: '测试参与者' },
      { label: '测试场景' },
      { label: '被一个弹窗卡住' },
    ]),
    learnings: [
      '9 个用户里有 5 个被同一个弹窗卡住，而做它的人谁都看不出来——为什么测试要找陌生人，这是我遇到过最直接的证据。',
      '按离线优先来设计，动的是架构，而不只是错误状态——就算背后什么都连不上，身份识别也得照样能用。',
      '出声思维法能暴露用户的犹豫，而这些犹豫在任务完成率里只会被记成“成功”。',
      '印刷生产有它自己的约束——出血、文字转曲、供应商的交期——这些都是屏幕上的原型永远教不了你的。',
    ],
  },
  {
    ...singink,
    titleAccent: '客服与工单系统',
    role: '整个客服系统由我负责',
    module: 'IT1x25 Web 开发项目',
    term: '2025/26 学年第二学期',
    summary:
      'Singink 电商平台的客服模块——带校验的工单提交、对话式回复、文件附件，还有一个带实时数据分析的管理后台。',
    features: [
      '🎫 工单增删改查',
      '📊 管理后台',
      '🔍 按状态筛选',
      '💬 回复功能',
      '📎 文件附件',
      '🔒 会话认证',
      '📈 统计图表',
      '❓ 常见问题搜索',
    ],
    screenshots: overlay(singink.screenshots, [
      { title: '客服中心' },
      { title: '新建工单' },
      { title: '我的工单' },
      { title: '工单详情' },
      { title: '管理后台' },
      { title: '后台工单列表' },
    ]),
    story: overlay(singink.story, [
      {
        label: '问题',
        heading: '所有求助都埋在一张联系表单里',
        body: '每个问题进来，都是一封毫无结构的邮件：没有分类，没有优先级，也没有历史记录。客服一遍遍追问同样的细节，用户也没法知道到底有没有人接手。所以第一步，是让双方有一份共同的记录。',
      },
      {
        label: '提交',
        heading: '在边界上就校验，别等到事后',
        body: '提交表单要求主题写得像样、分类和优先级都选好，否则什么都进不了数据库。服务器端也有同样的规则，因为 HTML 属性只是给用户行个方便——谁都能直接向接口发 POST 请求。被打回时，表单重新渲染，已经填的内容原样保留。',
      },
      {
        label: '跟踪',
        heading: '工单进度，用户自己看得到',
        body: '工单一提交就有了状态，用户能看着它变化。光是这一点，就省掉了大部分“有进展吗？”的追问——答案就在屏幕上。',
      },
      {
        label: '对话',
        heading: '回复、附件，还有审计记录',
        body: '每张工单都带着一串对话，可以附文件，客服还能加用户看不到的内部备注。时间线本身就是审计记录：谁在什么时候改了什么，都在上面。',
      },
      {
        label: '客服端',
        heading: '扫一眼就有答案的后台',
        body: '按状态和优先级统计的未结工单数、解决时长，还有工单队列本身，全在一个屏幕上。这样设计，是为了让客服一打开，先看到的是需要处理的事，而不是一张空白的筛选表单。',
      },
      {
        label: '结果',
        heading: '挑大梁的，是提交表单',
        body: '功劳几乎都不在我最期待的那个后台，而在提交表单：它第一次就把对的信息收齐，工单一到就能处理，不用再来回问一轮。',
      },
    ]),
    caseStudy: overlay(singink.caseStudy, [
      {
        label: '背景与任务',
        body: 'Singink 的跳出率很高，客服工作又全靠人工。用户遇到问题很难找到人帮忙，于是同样的问题一问再问，解决时间也拖得很长。我的任务是设计并搭建平台的工单部分，让问题的上报和回复处理都有章可循。',
      },
      {
        label: '我的做法',
        body: '我用面向对象的方式设计并实现了工单模块：用封装保证数据处理的安全，用继承复用组件。功能包括带字段校验和错误处理的工单提交表单、分类和优先级选择、文件上传、实时状态跟踪、可搜索的常见问题版块，以及一个完整的管理后台——统计图表、按状态和优先级筛选、内部备注和回复功能都有。另外还实现了基于会话的身份认证和基于角色的访问控制。',
      },
      {
        label: '成果',
        body: '结构化的提交取代了自由格式的邮件，工单一到就带齐了分类、优先级和处理所需的细节，不用再回头追问。状态跟踪让用户可以自己查进度；管理后台则把队列状况和解决时长放在了同一个屏幕上。这是一个团队结课项目，成绩 A；代码用 GitLab 做版本管理，用 Gunicorn 部署上线。',
      },
    ]),
    metrics: overlay(singink.metrics, [
      { label: '增删改查操作' },
      { label: 'Flask 路由' },
      { label: '数据库表' },
      { label: '校验规则' },
    ]),
    architecture: {
      flow: [
        '🌐 浏览器（HTML/CSS/JS）',
        '⚙️ Flask + Jinja2',
        '🛠️ SQLAlchemy ORM',
        '🗄️ SQLite 数据库',
      ],
      description:
        'MVC 架构：用 Flask Blueprint 做模块化路由，Jinja2 模板做服务器端渲染，SQLAlchemy 做数据库抽象。响应式 UI 组件用的是 Bootstrap 5。',
    },
    learnings: [
      '做增删改查，输入校验要扎实，错误提示要能告诉用户怎么改。',
      '用基于角色的访问控制，把管理员和普通用户的功能分开。',
      '设计关系型数据库的表结构，用外键保证数据完整性。',
      '做带实时筛选和数据分析的响应式后台。',
      '用 Flask 配合服务器端校验，安全地处理文件上传。',
    ],
  },
  {
    ...tableTennis,
    title: '乒乓球社团',
    titleAccent: '网站',
    role: '前端开发',
    module: 'IT1x15 Web 开发中的 UX 设计',
    term: '2025/26 学年第一学期',
    summary:
      '社团在网上没有自己的家——日程和比赛成绩全在群聊里。我给它设计并做了一个网站，从线框图一路做到上线。',
    features: [
      '🏠 首页与首屏大图',
      '🏆 战绩表',
      '📅 活动日历',
      '📷 Instagram 动态',
      '👥 成员风采',
      '📱 响应式设计',
      '🎨 手风琴式 UI',
      '🔗 社交媒体链接',
    ],
    screenshots: overlay(tableTennis.screenshots, [
      { title: '首页首屏' },
      { title: '为什么加入我们' },
      { title: '战绩与活动' },
      { title: '社交账号与动态' },
      { title: '成员风采' },
    ]),
    story: overlay(tableTennis.story, [
      {
        label: '问题',
        heading: '社团只活在群聊里',
        body: '训练时间、比赛成绩、招新通知，全散落在聊天记录里。新生不知道去哪里找，执委会每个学期都得把同样的信息再发一遍。网站得成为解答这些问题的唯一去处。',
      },
      {
        label: '招新',
        heading: '先回答“我为什么要加入？”',
        body: '有意加入的同学最先看到的那一块，得先让他们愿意看下去。加入有什么好处、训练要花多少时间、对水平有什么要求，都直截了当地写出来，不埋在社团历史底下。',
      },
      {
        label: '说服力',
        heading: '能排序、不过时的战绩',
        body: '一张可排序的战绩表，旁边是活动日历。比赛成绩是社团招新最有力的理由，所以它单独占一个版块，而不是一行脚注。',
      },
      {
        label: '保持更新',
        heading: '更新的事，交给 Instagram 动态',
        body: '社团本来就三天两头在 Instagram 上发帖，所以网站直接嵌入这个动态，而不是让执委会再维护第二个渠道。页面不用谁记着去更新，自己就是最新的。',
      },
      {
        label: '成员',
        heading: '真人，不是图库照片',
        body: '成员风采版块放的是真实的成员，还有他们自己说的话。这是执委会最在意的部分，也正是它，让网站像个社团，而不是一本宣传册。',
      },
    ]),
    caseStudy: overlay(tableTennis.caseStudy, [
      {
        label: '背景与任务',
        body: '乒乓球社是学校的课程辅助活动（CCA）之一，却一直没有官方的网上阵地，向学生宣传、和学生互动都很受限。活动日程、战绩和招新都没有一个集中的平台，信息只能散落在各个群聊里。我的任务是从零做一个响应式网站，给社团建起自己的线上平台。',
      },
      {
        label: '我的做法',
        body: '整个社团网站，从设计到搭建都是我从零做的：带图片轮播的首屏、可排序的战绩表、活动日历、以嵌入方式接入的 Instagram 动态、附成员感言的成员风采、用手风琴折叠面板呈现的联系方式，以及社交媒体链接。全站都采用响应式设计，兼容移动端。',
      },
      {
        label: '成果',
        body: '社团有了一个集中的线上平台，所有信息都归拢到了一处。活动和战绩更容易被看到；现代、好用的设计让学生更愿意参与；这套模板可以扩展，其他社团也能沿用。',
      },
    ]),
    metrics: overlay(tableTennis.metrics, [
      { label: '页面版块' },
      { label: 'UI 组件' },
      { label: '完全响应式' },
      { label: 'API 集成' },
    ]),
    architecture: {
      flow: ['🎨 Figma 线框图', '🌐 HTML5 / CSS3 / JS', '📐 Bootstrap 5 栅格', '📱 响应式部署'],
      description:
        '静态前端，用语义化的 HTML5、CSS3 动画和 Bootstrap 5 栅格搭建。Instagram 动态和 Google 日历交给第三方嵌入来处理。',
    },
    learnings: [
      '用 HTML5、CSS3 和 JavaScript，把一个完整的网站从线框图做到部署。',
      '用 Bootstrap 栅格做移动优先的响应式设计。',
      '接入第三方 API 和嵌入组件（Instagram、Google 日历）。',
      '把 UX 原则落到实处——视觉层次、留白、用户流程优化。',
      '做可复用的 UI 组件，比如轮播、手风琴折叠面板和标签页导航。',
      '收集各方需求，并根据社团成员的反馈不断迭代。',
    ],
  },
  {
    ...swaplah,
    titleAccent: '学生合作社买卖平台',
    role: '用户管理负责人',
    module: '敏捷开发流程与 DevOps',
    term: '2026 年 4 月至 8 月',
    summary:
      '在《敏捷开发流程与 DevOps》课上做的学生合作社买卖平台，整个项目都在 GitLab 上推进。用户管理这一块，从头到尾都是我负责。',
    features: [
      '🔐 注册与登录',
      '👤 个人资料管理',
      '⏲️ 会话超时',
      '🚧 访问限制',
      '🔑 Werkzeug 密码哈希',
      '📋 GitLab Epic 与用户故事',
      '🔁 CI/CD 文档',
      '🧾 测试计划与完成标准',
    ],
    caseStudy: overlay(swaplah.caseStudy, [
      {
        label: '背景与任务',
        body: '这个学生合作社买卖平台，是我们团队在《敏捷开发流程与 DevOps》课上用 GitLab 协作做出来的。我分到的是用户管理：从陌生人第一次打开网站，到注册登录、建好个人资料，再到会话到时过期，这一整段都归我。',
      },
      {
        label: '我的做法',
        body: '注册、登录与登出、个人资料管理、会话超时和访问限制，我都做进了一个 Flask Blueprint；密码哈希用 werkzeug，数据库直接用原生 sqlite3，不用 ORM。这部分工作事先就定义清楚了：一个 GitLab Epic，拆成 5 个用户故事，每个都带 Given-When-Then 验收标准——一行代码还没写，“完成”是什么样子就已经定下来了。团队的 CI/CD 流水线文档、测试计划、完成标准和安全文档，也是我写的。',
      },
      {
        label: '成果',
        body: '事实证明，真正有用的是 Given-When-Then 标准：先写验收条件再写代码，会话超时和访问限制这些情况就是事先规定好的，而不是事后才撞上的；测试计划也顺着用户故事水到渠成。这门课最后拿了 A。',
      },
    ]),
    metrics: overlay(swaplah.metrics, [
      { label: '用户故事' },
      { label: 'GitLab Epic' },
      { label: '我写的文档' },
      { label: 'GWT 验收标准' },
    ]),
    learnings: [
      '在写代码之前写好 Given-When-Then 验收标准，“完成”就从见仁见智的判断，变成了一张可以逐项核对的清单。',
      '密码哈希和会话过期，在认证里属于很容易跳过、事后再补却代价很高的部分。',
      '不用 ORM、直接写原生 sqlite3，SQL 就全摆在明面上——表结构不大的时候，这个取舍说得过去。',
      '写 CI/CD 和安全文档，逼着我真正弄懂了这条流水线，而不只是会用它。',
    ],
  },
  {
    ...abcRetail,
    titleAccent: '审查与重写',
    role: '个人作业',
    module: 'IT2113 云计算',
    term: '2026 年 8 月',
    summary:
      '用 Kiro（AWS 的智能体式开发环境）生成的电商店面原型——随后像对待任何初稿一样人工审查了一遍，找出了 7 个缺陷，自动生成的测试一个都没发现。核实过的逻辑原样保留，每个组件都重写了一遍。',
    features: [
      '📝 Kiro 规格驱动生成',
      '🔍 人工找出 7 个缺陷',
      '♻️ 纯逻辑层原样保留',
      '🧱 10 个组件全部重写',
      '🛒 分类与价格筛选',
      '💱 SGD / MYR 货币切换',
      '🧊 桌面端 3D 商品展示',
      '🔒 私有 S3 + CloudFront',
    ],
    caseStudy: overlay(abcRetail.caseStudy, [
      {
        label: '背景与任务',
        body: '《云计算》这门课的作业，是给题目设定的案例公司 ABC Retail 写一份上云迁移方案。这家新加坡电子产品零售商，网站、数据库和文件存储全压在一台老旧的服务器上。作业的一部分，是用 Kiro 生成店面的前端原型，再部署到 AWS 上。生成网站是容易的那一半；值得下功夫的，是审查它的那一半。',
      },
      {
        label: '我的做法',
        body: '我用的是 Kiro 的规格驱动工作流，而不是随手写提示词，所以需求、设计和任务清单在写出任何代码之前就都审过了。它生成的基线版本——46 个源文件、10 个组件、21 个测试文件——接着过了一遍人工审查：逐个点击测试、用键盘操作、做性能分析，再到小屏幕上逐一测量。纯逻辑层是对的，也有基于属性的测试覆盖，所以原封不动，保留了 Kiro 的写法；每个组件则都在原有结构和 props 的基础上重写了一遍。',
      },
      {
        label: '成果',
        body: '找出了 7 个自动化检查都没发现的缺陷，并逐一修好。其中包括：一个多余的层叠上下文，让“加入购物车”按钮根本点不到；轮播里对读屏软件隐藏的幻灯片，却还能用 Tab 键切进去（不符合 WCAG 4.1.2）；货币切换更新了状态，界面却从不重新渲染；还有一个 WebGL 菜单，移除之后还在不停渲染。项目从 46 个源文件扩充到 191 个，测试文件增加到 44 个，部署在 CloudFront 后面的私有 S3 存储桶里。成绩 A。',
      },
    ]),
    metrics: overlay(abcRetail.metrics, [
      { label: '人工找出的缺陷' },
      { label: '重写的组件' },
      { label: '源文件（原 46 个）' },
      { label: '测试文件（原 21 个）' },
    ]),
    architecture: {
      flow: ['Kiro 规格', 'Vite 构建', '私有 S3 存储桶', 'CloudFront', '访客'],
      description:
        '存储桶始终不公开。Origin Access Control 只允许这个 CloudFront 分发读取它，所以访客能用上 HTTPS 和边缘缓存，而“阻止公有访问”一直开着。部署只要 3 步：构建，把 dist/ 同步到存储桶，再让 CloudFront 缓存失效。',
    },
    learnings: [
      '自动生成的测试，只检查生成器想到要检查的东西。一个谁都点不到的“加入购物车”按钮，照样通过了全部测试。',
      '每个要紧的缺陷，都是靠鼠标、键盘、性能分析器或窄屏找出来的——没有一个是测试跑出来的。',
      '好的审查，也包括判断哪些地方不用动：访客今天用到的筛选和价格格式化，仍然是 Kiro 写的代码，因为它们本来就是对的。',
    ],
  },
];

export const getProject = (slug: string): Project | undefined =>
  projects.find((project) => project.slug === slug);

/** Redefined rather than re-exported: the English one filters the English list. */
export const featuredProjects = projects.filter((project) => project.featured);
