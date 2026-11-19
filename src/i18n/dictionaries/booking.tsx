import type { ReactNode } from 'react';
import { Info, type DateTime } from 'luxon';
import type { ApiError, ApiIssue, BookingStep, SlotState } from '@/components/booking/types';
import { intlLocale, type Locale } from '../config';

/**
 * Strings for /book: the page around the flow, the three steps, and every
 * message the flow can show when something goes wrong.
 *
 * Three things here are not plain strings, for reasons that only show up in
 * the second language:
 *
 *   · Errors. The API answers in English, with a stable `error` code beside the
 *     sentence. The English page shows the server's sentence, as it always has —
 *     it was written for this form and is more specific than the code. The
 *     Chinese page cannot show it, so it picks its own words by code, and by
 *     field for a form the server rejected.
 *   · Dates and times. Each language formats its own, so the Chinese page reads
 *     11月20日星期五 09:00 rather than an English date with Chinese around it.
 *   · How to address the visitor. English thanks them by first name; a Chinese
 *     name is not a first name followed by a surname.
 *
 * Not here, and staying English on purpose: the owner's approval page under
 * /book/requests, the booking emails, and the calendar event a visitor saves.
 */

/** Wraps part of a sentence in whatever element the component styles it with. */
type Wrap = (text: string) => ReactNode;

/** What the confirmation screen says was requested. */
interface HeldRequest {
  /** As the visitor typed it. */
  name: string;
  minutes: number;
  /** The start, in the visitor's zone. */
  when: string;
  /** The same start in Richie's zone, when the two differ. */
  ownerTime: string | null;
}

/**
 * Every English date on this page has always come out in en-US: the times set
 * it explicitly, and luxon's `toFormat` falls back to it wherever no locale is
 * given. `intlLocale.en` is en-SG, which would print "2:30 pm" for "2:30 PM",
 * so English keeps the locale it shipped with.
 */
const EN = 'en-US';

const en = {
  meta: {
    title: 'Book a session',
    description:
      'Pick a 15, 30, 45, or 60 minute slot on my calendar. Only my free/busy is shown — never what I am actually doing.',
  },

  page: {
    /** `accent` wraps the words set in the lime gradient. */
    heading: (accent: Wrap): ReactNode => <>Let’s find {accent('a time')}</>,
    /** Promises only what the running calendar can keep: `live` is false in demo mode. */
    lede: (live: boolean): string =>
      `Internships, project questions, a code review, or just a conversation about building things. ${
        live
          ? 'Pick a length and a slot. It is held for you straight away, and I’ll confirm it myself — you’ll hear back either way.'
          : 'Pick a length and a slot — this calendar is in demo mode at the moment, so I’ll confirm by email.'
      }`,
    assurances: {
      held: {
        title: 'Held while I answer',
        body: 'Your slot is reserved the moment you submit, and I confirm it myself — usually the same day.',
      },
      /** Takes `held`'s place in demo mode. */
      byEmail: {
        title: 'Confirmed by email',
        body: 'The calendar is in demo mode right now, so I confirm each request by email myself.',
      },
      freeBusy: {
        title: 'Free/busy only',
        body: 'The grid shows whether I am free — never event titles, guests, or what I am doing.',
      },
      timezone: {
        title: 'Your timezone',
        body: 'Every slot is shown in my time and yours, so nobody does mental arithmetic.',
      },
    },
    /** `link` is the mailto link, already rendered. */
    emailInstead: (link: ReactNode): ReactNode => <>Prefer email? Reach me at {link}.</>,
  },

  steps: {
    progress: 'Booking progress',
    names: {
      when: 'When',
      details: 'Details',
      done: 'Done',
    } satisfies Record<BookingStep, string>,
  },

  /** Step one, around the calendar. Durations are `commonDict.minutes`. */
  when: {
    lengthGroup: 'Session length',
    demoNotice:
      'Showing demo availability. Once Google Calendar is connected this grid reflects my real free/busy — only whether I am free, never what I am doing.',
  },

  calendar: {
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    grid: 'Choose a date',
    /** A day cell's name for a screen reader. `freeSlots` is null when it cannot be booked. */
    dayLabel: (date: string, freeSlots: number | null): string =>
      freeSlots === null ? `${date} — unavailable` : `${date} — ${freeSlots} slots free`,
    checking: 'Checking calendar…',
  },

  slots: {
    pickDate: 'Pick a date to see what is open.',
    emptyDay: 'Nothing on this day — I keep weekends clear. Try a weekday.',
    freeCount: (count: number) => `${count} free`,
    list: 'Available times',
    /** Under a slot, when the visitor is in another time zone. */
    yourTime: (time: string) => `${time} your time`,
    zoneNote: (owner: string, viewer: string) => `Times shown in ${owner} · your zone is ${viewer}`,
    /** The legend, keyed by state. `description` is its tooltip. */
    legend: {
      free: { label: 'Free', description: 'Open — pick it and it is yours.' },
      busy: { label: 'Busy', description: 'Already booked or blocked on my calendar.' },
      notice: { label: 'Too soon', description: 'Inside my minimum notice window.' },
      past: { label: 'Past', description: 'This time has already gone.' },
    } satisfies Record<SlotState, { label: string; description: string }>,
    /** Tooltip on a slot that cannot be taken. */
    unavailableReason: {
      busy: 'Already booked',
      past: 'This time has passed',
      notice: 'Inside the minimum-notice window',
    } satisfies Record<Exclude<SlotState, 'free'>, string>,
  },

  details: {
    sessionLength: (minutes: number) => `${minutes} minute session`,
    /** Under the chosen slot. `viewerWhen` is that moment in the visitor's zone, if it differs. */
    zoneLine: (ownerZone: string, viewerWhen: string | null): string =>
      `${ownerZone} time${viewerWhen ? ` · ${viewerWhen} your time` : ''}`,
    nameLabel: 'Name',
    namePlaceholder: 'Jamie Tan',
    emailLabel: 'Email',
    emailPlaceholder: 'jamie@company.com',
    topicLabel: 'What is it about?',
    topicPlaceholder: 'Internship opportunity',
    /**
     * One-tap topics. A pick is sent exactly as written, so Richie receives it in the language
     * the visitor was reading.
     */
    topics: ['Internship opportunity', 'Project collaboration', 'Code review', 'Just a chat'],
    noteLabel: 'Anything I should read first?',
    notePlaceholder: 'A link, some context, or a question you want answered.',
    /** The honeypot's label. Hidden from people; a bot reads it like any other field. */
    honeypot: 'Company (leave blank)',
    back: 'Change time',
    submitting: 'Confirming…',
    submit: 'Confirm booking',
    privacy:
      'Your details are used to create the calendar invite and nothing else. No list, no newsletter, no third parties.',
  },

  /** In place of the calendar when availability cannot be read at all. */
  unavailable: {
    heading: 'Calendar unavailable',
    retry: 'Try again',
    emailMe: 'Email me instead',
    /** Subject line of the email that button starts. */
    emailSubject: 'Booking a session',
  },

  confirmation: {
    heading: 'Your slot is held',
    thanks: (strong: Wrap, { name, minutes, when, ownerTime }: HeldRequest): ReactNode => (
      <>
        Thanks {name.split(/\s+/)[0]} — I’ve asked Richie about {minutes} minutes on {strong(when)}
        {ownerTime ? ` (${ownerTime} his time)` : ''}. Nobody else can take that time while he
        decides.
      </>
    ),
    /** `by` is when the hold lapses, in the visitor's zone. */
    hearBack: (strong: Wrap, by: string | null): ReactNode => (
      <>
        He confirms each session himself, so you’ll hear back either way
        {by ? <> by {strong(by)}</> : null}. The calendar invitation arrives once he says yes.
      </>
    ),
    demo: 'Demo mode — the slot is held on this site, but no calendar invite was sent because Google credentials are not configured yet.',
    reference: 'Reference',
    copyReference: 'Copy reference',
    downloadIcs: 'Download .ics',
    addToGoogle: 'Add to Google',
    join: 'Join link',
    bookAnother: 'Book another session',
  },

  errors: {
    /** No response arrived at all. */
    network: 'Could not reach the server. Check your connection and try again.',
    /**
     * Loading availability failed. Upstream text is never shown here — Google's
     * reasons read like "invalid_grant" — except a rate limit, which English has
     * always repeated from the server.
     */
    availability: {
      calendarDown:
        "I can't reach my calendar right now, so I can't show what's free. Try again in a minute, or just email me.",
      rateLimited: (serverMessage: string): string => serverMessage,
      generic: 'Could not load availability. Please try again.',
    },
    /** The booking was refused. Shown above the form, and as a toast when the slot went. */
    submit: (error: ApiError): string =>
      error.message || 'Could not complete the booking. Please try again.',
    /** One field the server rejected, shown under that field. */
    field: (issue: ApiIssue): string => issue.message,
  },

  /** Every date and time on the page. Each takes a DateTime already in the zone it describes. */
  format: {
    monthTitle: (month: DateTime) => month.setLocale(EN).toFormat('LLLL yyyy'),
    /** Column heads, Sunday first, as the grid is laid out. */
    weekdayInitials: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    /** A day cell's date, for its screen-reader name. */
    dayName: (day: DateTime) => day.setLocale(EN).toFormat('cccc d LLLL'),
    /** Above the slots for one day. */
    dayHeading: (day: DateTime) => day.setLocale(EN).toFormat('cccc, d LLLL'),
    time: (at: DateTime) => at.setLocale(EN).toFormat('h:mm a'),
    dateTime: (at: DateTime) => at.setLocale(EN).toFormat("cccc d LLLL 'at' h:mm a"),
    fullDateTime: (at: DateTime) => at.setLocale(EN).toFormat("cccc d LLLL yyyy 'at' h:mm a"),
    /** A zone in a few words: "Singapore". */
    zoneShort: (zone: string) => zone.split('/')[1]?.replace('_', ' ') ?? zone,
    /** A zone named in full: "Asia/Singapore". */
    zoneFull: (zone: string) => zone.replace('_', ' '),
  },
};

const ZH = intlLocale.zh;

/** Chinese schedules are written on a 24-hour clock. zh-SG on its own would print 下午2:30. */
const CLOCK = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } as const;
const DAY = { month: 'long', day: 'numeric', weekday: 'long' } as const;

/**
 * A zone's Chinese name — 新加坡标准时间, 英国时间, 北美东部时间. The generic
 * name rather than the seasonal one, so a footnote does not change its wording
 * when daylight saving starts. Falls back to the id for a zone Intl does not know.
 */
function zoneName(zone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat(ZH, { timeZone: zone, timeZoneName: 'longGeneric' });
    const name = formatter.formatToParts(new Date()).find((part) => part.type === 'timeZoneName');
    return name?.value ?? zone;
  } catch {
    return zone;
  }
}

/** Monday-first, as Intl lists them, turned to start on Sunday like the grid. */
const weekdaysFromSunday = (mondayFirst: string[]) => [mondayFirst[6], ...mondayFirst.slice(0, 6)];

const zhInvalidRequest = '有些信息没填对，请检查后再提交。';

/*
  Chosen by field and zod's issue code, the two parts of a rejection that are not
  English. `too_big` is a value over its limit; anything else wrong with a name
  means it is missing or too short.
*/
const zhField = ({ field, code }: ApiIssue): string => {
  switch (field) {
    case 'name':
      return code === 'too_big' ? '姓名太长了，请改短一点。' : '请填写你的姓名。';
    case 'email':
      return '请填写有效的邮箱地址。';
    default:
      return zhInvalidRequest;
  }
};

const zh: typeof en = {
  meta: {
    title: '约个时间聊聊',
    description:
      '在我的日历上挑一个 15、30、45 或 60 分钟的时段。这里只看得到我有没有空，看不到我在做什么。',
  },

  page: {
    heading: (accent) => <>一起找个{accent('时间')}</>,
    lede: (live) =>
      `实习机会、项目上的问题、代码评审，或者单纯聊聊做开发的那些事，都欢迎。${
        live
          ? '选好时长和时段，马上就为你保留。我会亲自确认，成不成都会给你答复。'
          : '选好时长和时段就行——日历目前是演示模式，我会发邮件跟你确认。'
      }`,
    assurances: {
      held: {
        title: '先为你保留',
        body: '一提交就为你锁定这个时段。我会亲自确认，通常当天就有答复。',
      },
      byEmail: {
        title: '邮件确认',
        body: '日历目前是演示模式，所以每个预约申请我都会亲自发邮件确认。',
      },
      freeBusy: {
        title: '只显示忙闲',
        body: '日历上只看得到我有没有空——看不到日程标题、参与者，也看不到我在做什么。',
      },
      timezone: {
        title: '你所在的时区',
        body: '每个时段都标出我这边和你那边的时间，谁都不用心算时差。',
      },
    },
    emailInstead: (link) => <>更习惯用邮件？直接发到 {link}。</>,
  },

  steps: {
    progress: '预约进度',
    names: {
      when: '选择时间',
      details: '填写信息',
      done: '完成',
    },
  },

  when: {
    lengthGroup: '时长',
    demoNotice:
      '现在显示的是演示数据。接入 Google 日历之后，这里会显示我真实的忙闲——只显示有没有空，不显示我在做什么。',
  },

  calendar: {
    previousMonth: '上个月',
    nextMonth: '下个月',
    grid: '选择日期',
    dayLabel: (date, freeSlots) =>
      freeSlots === null ? `${date}，不可预约` : `${date}，有 ${freeSlots} 个空闲时段`,
    checking: '正在查询日历……',
  },

  slots: {
    pickDate: '选一个日期，看看哪些时段有空。',
    emptyDay: '这天没有可约的时段——周末我不排日程。换个工作日试试吧。',
    freeCount: (count) => `${count} 个空闲时段`,
    list: '可选时段',
    yourTime: (time) => `你那边 ${time}`,
    zoneNote: (owner, viewer) => `时段按${owner}显示 · 你所在的时区：${viewer}`,
    legend: {
      free: { label: '空闲', description: '空着——选了就是你的。' },
      busy: { label: '忙碌', description: '已经有人约了，或者我日历上另有安排。' },
      notice: { label: '太临近', description: '离现在太近，来不及安排。' },
      past: { label: '已过', description: '这个时间已经过去了。' },
    },
    unavailableReason: {
      busy: '已有安排',
      past: '这个时间已经过了',
      notice: '离现在太近，来不及预约',
    },
  },

  details: {
    sessionLength: (minutes) => `时长 ${minutes} 分钟`,
    zoneLine: (ownerZone, viewerWhen) =>
      `${ownerZone}${viewerWhen ? ` · 你那边是 ${viewerWhen}` : ''}`,
    nameLabel: '姓名',
    namePlaceholder: '陈嘉明',
    emailLabel: '邮箱',
    emailPlaceholder: 'jiaming@company.com',
    topicLabel: '想聊什么？',
    topicPlaceholder: '实习机会',
    topics: ['实习机会', '项目合作', '代码评审', '随便聊聊'],
    noteLabel: '有什么想让我先看看的吗？',
    notePlaceholder: '可以是一个链接、一些背景，或者你想问的问题。',
    honeypot: '公司（请留空）',
    back: '换个时间',
    submitting: '提交中……',
    submit: '确认预约',
    privacy: '你的信息只用来生成日历邀请，别无他用：不进邮件列表，不发订阅邮件，也不交给第三方。',
  },

  unavailable: {
    heading: '日历暂时不可用',
    retry: '重试',
    emailMe: '改用邮件联系',
    emailSubject: '约个时间聊聊',
  },

  confirmation: {
    heading: '时段已为你保留',
    /*
      The whole name. Thanking someone by their first word is right for "Jamie Tan" and wrong
      for "Tan Wei Ming", or for a name written in Chinese.
    */
    thanks: (strong, { name, minutes, when, ownerTime }) => (
      <>
        谢谢你，{name.trim()}。我已经替你向 Richie 申请了 {minutes} 分钟，时间是 {strong(when)}
        {ownerTime ? `（他那边是 ${ownerTime}）` : ''}。在他答复之前，这个时间别人约不走。
      </>
    ),
    hearBack: (strong, by) => (
      <>
        每次预约他都会亲自确认，不管成不成，{by ? <>最晚 {strong(by)} 之前</> : null}
        你都会收到答复。他一点头，日历邀请就会发到你的邮箱。
      </>
    ),
    demo: '演示模式——时段已在本站为你保留，但 Google 凭据还没配置好，所以没有发出日历邀请。',
    reference: '预约编号',
    copyReference: '复制预约编号',
    downloadIcs: '下载 .ics 文件',
    addToGoogle: '添加到 Google 日历',
    join: '加入会议',
    bookAnother: '再约一个时间',
  },

  errors: {
    network: '连不上服务器。请检查网络连接，然后再试一次。',
    availability: {
      calendarDown: '暂时连不上我的日历，没法显示哪些时间有空。过一分钟再试，或者直接发邮件给我。',
      rateLimited: () => '刷新得太频繁了，请稍等片刻再试。',
      generic: '可预约时间没能加载出来，请再试一次。',
    },
    /* A refused form is explained by its first bad field, as the server's English sentence is. */
    submit: (error) => {
      const first = error.issues?.[0];
      if (first) return zhField(first);
      switch (error.error) {
        case 'invalid_request':
          return zhInvalidRequest;
        case 'rate_limited':
          return '提交得太频繁了，请过几分钟再试。';
        case 'slot_unavailable':
          return '这个时段现在约不了了，请换一个时间。';
        case 'slot_already_booked':
          return '这个时段刚被别人约走了，请换一个时间再试。';
        case 'calendar_unavailable':
          return '暂时连不上我的日历，这次没能提交成功。请过一会儿再试，或者直接发邮件给我。';
        default:
          return '预约没能完成，请再试一次。';
      }
    },
    field: zhField,
  },

  format: {
    monthTitle: (month) => month.setLocale(ZH).toLocaleString({ year: 'numeric', month: 'long' }),
    weekdayInitials: weekdaysFromSunday(Info.weekdays('narrow', { locale: ZH })),
    dayName: (day) => day.setLocale(ZH).toLocaleString(DAY),
    dayHeading: (day) => day.setLocale(ZH).toLocaleString(DAY),
    time: (at) => at.setLocale(ZH).toLocaleString(CLOCK),
    dateTime: (at) => at.setLocale(ZH).toLocaleString({ ...DAY, ...CLOCK }),
    fullDateTime: (at) => at.setLocale(ZH).toLocaleString({ year: 'numeric', ...DAY, ...CLOCK }),
    zoneShort: zoneName,
    zoneFull: zoneName,
  },
};

export const bookingDict: Record<Locale, typeof en> = { en, zh };
