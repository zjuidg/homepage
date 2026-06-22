import { createSignal } from 'solid-js';

export type Lang = 'en' | 'zh';

const KEY = 'idg-lang';

interface Area {
  title: string;
  desc: string;
}

export interface Copy {
  langLabel: string; // label shown on the switcher (the OTHER language to switch to)
  nav: { about: string; highlights: string; network: string; publications: string; contact: string };
  hero: {
    eyebrow: string;
    title1: string;
    title2: string;
    lead: string;
    explore: string;
    aboutCta: string;
    stats: { publications: string; venues: string; founded: string };
  };
  about: {
    eyebrow: string;
    headingPre: string;
    headingEm: string;
    headingPost: string;
    body: string;
    areas: [Area, Area, Area, Area];
  };
  highlights: { eyebrow: string; heading: string; subtitle: string };
  network: {
    eyebrow: string;
    heading: string;
    intro: string;
    filterLabel: string;
    thAll: string;
    th2: string;
    th3: string;
    stats: (nodes: number, links: number) => string;
    hint: string;
    cardMeta: (papers: number, collaborators: number) => string;
    legendSize: string;
    legendLink: string;
  };
  pubs: {
    eyebrow: string;
    heading: string;
    intro: (n: number) => string;
    search: string;
    allVenues: string;
    awardPapers: string;
    allYears: string;
    showing: (shown: number, total: number, filtered: boolean) => string;
    empty: string;
    prevPage: string;
    nextPage: string;
  };
  card: {
    paper: string;
    doi: string;
    video: string;
    demo: string;
    system: string;
    abstract: string;
    hideAbstract: string;
  };
  footer: {
    eyebrow: string;
    headingPre: string;
    headingEm: string;
    headingPost: string;
    body: string;
    brand: string;
    lab: string;
    address1: string;
    address2: string;
    links: { about: string; highlights: string; publications: string };
    rights: (year: number) => string;
    backToTop: string;
  };
  loading: string;
}

const en: Copy = {
  langLabel: '中文',
  nav: {
    about: 'About',
    highlights: 'Highlights',
    network: 'Network',
    publications: 'Publications',
    contact: 'Contact',
  },
  hero: {
    eyebrow: 'Zhejiang University · State Key Lab of CAD&CG',
    title1: 'Interactive',
    title2: 'Data Group',
    lead: 'We build visualization, visual analytics, immersive analytics, and interaction techniques that help people make sense of large, complex data — in sports analytics, social media, and urban informatics.',
    explore: 'Explore publications',
    aboutCta: 'About the group',
    stats: { publications: 'Publications', venues: 'Venues', founded: 'Founded' },
  },
  about: {
    eyebrow: 'About us',
    headingPre: 'Visualization and interaction for ',
    headingEm: 'data at scale',
    headingPost: '',
    body: 'Founded in 2015 within the State Key Lab of CAD&CG at Zhejiang University, the Interactive Data Group develops visualization, visual analytics, and interaction techniques for analytical reasoning at scale.',
    areas: [
      {
        title: 'Information Visualization',
        desc: 'Expressive visual representations and authoring tools that make complex data legible and explorable.',
      },
      {
        title: 'Visual Analytics',
        desc: 'Human-in-the-loop analysis for sports, social media, and urban informatics — coupling models with interaction.',
      },
      {
        title: 'Immersive & AR/VR',
        desc: 'Situated and immersive analytics that bring data into the physical world and live performance settings.',
      },
      {
        title: 'Human–AI Interaction',
        desc: 'Interfaces that make large models, agents, and automated pipelines steerable, trustworthy, and verifiable.',
      },
    ],
  },
  highlights: {
    eyebrow: 'Highlights',
    heading: 'Recent highlights',
    subtitle: 'Talks, awards, and papers our group has recently presented.',
  },
  network: {
    eyebrow: 'Collaboration network',
    heading: 'A network of co-authors',
    intro:
      'Each node is an author; each link, a shared paper. Drag to explore, hover to spotlight collaborators.',
    filterLabel: 'Show authors with',
    thAll: 'Any paper',
    th2: '2+ papers',
    th3: '3+ papers',
    stats: (nodes, links) => `${nodes} authors · ${links} collaborations`,
    hint: 'Hover or drag a node to inspect an author.',
    cardMeta: (papers, collaborators) =>
      `${papers} paper${papers === 1 ? '' : 's'} · ${collaborators} collaborator${collaborators === 1 ? '' : 's'}`,
    legendSize: 'Papers authored',
    legendLink: 'Shared papers',
  },
  pubs: {
    eyebrow: 'Publications',
    heading: 'Our research',
    intro: (n) =>
      `${n} peer-reviewed papers at venues including IEEE VIS, ACM CHI, UIST, and PacificVis. Search or filter below.`,
    search: 'Search title, author, or venue…',
    allVenues: 'All venues',
    awardPapers: 'Award papers',
    allYears: 'All years',
    showing: (shown, total, filtered) =>
      `Showing ${shown} of ${total}${filtered ? ' filtered' : ''} papers`,
    empty: 'No publications match your filters.',
    prevPage: 'Previous page',
    nextPage: 'Next page',
  },
  card: {
    paper: 'Paper',
    doi: 'DOI',
    video: 'Video',
    demo: 'Demo',
    system: 'System',
    abstract: 'Abstract',
    hideAbstract: 'Hide abstract',
  },
  footer: {
    eyebrow: 'Get in touch',
    headingPre: 'Interested in ',
    headingEm: 'collaborating',
    headingPost: '?',
    body: 'We welcome research collaborations and prospective students passionate about visualization, visual analytics, and human–AI interaction.',
    brand: 'Interactive Data Group',
    lab: 'State Key Lab of CAD&CG, Zhejiang University',
    address1: 'Mengminwei Building, No. 866 Yuhangtang Rd.',
    address2: 'Hangzhou, Zhejiang 310058, P.R. China',
    links: { about: 'About', highlights: 'Highlights', publications: 'Publications' },
    rights: (year) => `© ${year} Interactive Data Group · Zhejiang University`,
    backToTop: 'Back to top ↑',
  },
  loading: 'Loading research…',
};

const zh: Copy = {
  langLabel: 'EN',
  nav: {
    about: '关于',
    highlights: '近期亮点',
    network: '合作网络',
    publications: '学术论文',
    contact: '联系',
  },
  hero: {
    eyebrow: '浙江大学 · 计算机辅助设计与图形系统全国重点实验室',
    title1: 'Interactive',
    title2: 'Data Group',
    lead: '我们研究信息可视化、可视分析、沉浸式分析与人机交互技术，帮助人们理解大规模、复杂的数据——涵盖体育分析、社交媒体与城市信息学等领域。',
    explore: '浏览论文',
    aboutCta: '了解课题组',
    stats: { publications: '学术论文', venues: '期刊与会议', founded: '成立年份' },
  },
  about: {
    eyebrow: '关于我们',
    headingPre: '面向大规模数据的',
    headingEm: '可视化与交互',
    headingPost: '',
    body: 'Interactive Data Group 成立于 2015 年，隶属于浙江大学计算机辅助设计与图形系统全国重点实验室，致力于研究面向大规模分析推理的可视化、可视分析与交互技术。',
    areas: [
      {
        title: '信息可视化',
        desc: '富有表现力的可视化表示与创作工具，让复杂数据清晰易读、便于探索。',
      },
      {
        title: '可视分析',
        desc: '面向体育、社交媒体与城市信息学的人在回路分析，将模型与交互紧密结合。',
      },
      {
        title: '沉浸式与 AR/VR',
        desc: '情境化与沉浸式分析，将数据带入物理世界与现场演出等场景。',
      },
      {
        title: '人机智能交互',
        desc: '让大模型、智能体与自动化流程可控、可信、可验证的交互界面。',
      },
    ],
  },
  highlights: {
    eyebrow: '近期亮点',
    heading: '近期亮点',
    subtitle: '课题组近期的学术报告、获奖与论文。',
  },
  network: {
    eyebrow: '合作网络',
    heading: '作者合作网络',
    intro:
      '每个节点是一位作者，每条连线代表一篇合作论文。可拖拽探索，悬停高亮合作者。',
    filterLabel: '筛选作者',
    thAll: '全部',
    th2: '≥2 篇',
    th3: '≥3 篇',
    stats: (nodes, links) => `${nodes} 位作者 · ${links} 条合作`,
    hint: '悬停或拖拽节点以查看作者信息。',
    cardMeta: (papers, collaborators) => `${papers} 篇论文 · ${collaborators} 位合作者`,
    legendSize: '论文数量',
    legendLink: '合作论文',
  },
  pubs: {
    eyebrow: '学术论文',
    heading: '我们的研究',
    intro: (n) =>
      `${n} 篇经同行评审的论文，发表于 IEEE VIS、ACM CHI、UIST、PacificVis 等会议与期刊。可在下方搜索或筛选。`,
    search: '搜索标题、作者或发表会议…',
    allVenues: '全部会议',
    awardPapers: '获奖论文',
    allYears: '全部年份',
    showing: (shown, total, filtered) =>
      `显示 ${shown} / 共 ${total} 篇论文${filtered ? '（已筛选）' : ''}`,
    empty: '没有符合筛选条件的论文。',
    prevPage: '上一页',
    nextPage: '下一页',
  },
  card: {
    paper: '论文',
    doi: 'DOI',
    video: '视频',
    demo: '演示',
    system: '系统',
    abstract: '摘要',
    hideAbstract: '收起摘要',
  },
  footer: {
    eyebrow: '联系我们',
    headingPre: '想和我们一起',
    headingEm: '做研究',
    headingPost: '吗？',
    body: '我们欢迎科研合作，也欢迎对可视化、可视分析与人机智能交互充满热情的同学加入。',
    brand: 'Interactive Data Group',
    lab: '浙江大学计算机辅助设计与图形系统全国重点实验室',
    address1: '浙江省杭州市余杭塘路 866 号蒙民伟楼',
    address2: '邮编 310058',
    links: { about: '关于', highlights: '近期亮点', publications: '学术论文' },
    rights: (year) => `© ${year} Interactive Data Group · 浙江大学`,
    backToTop: '回到顶部 ↑',
  },
  loading: '正在加载研究内容…',
};

const dict: Record<Lang, Copy> = { en, zh };

function detect(): Lang {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'en' || stored === 'zh') return stored;
  } catch {
    /* ignore */
  }
  // English is the default; users opt into Chinese via the switcher (persisted).
  return 'en';
}

const [lang, setLangSignal] = createSignal<Lang>(detect());

export { lang };

function applyHtmlLang(l: Lang) {
  document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
}
applyHtmlLang(lang());

export function setLang(l: Lang) {
  setLangSignal(l);
  applyHtmlLang(l);
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* ignore */
  }
}

export function toggleLang() {
  setLang(lang() === 'en' ? 'zh' : 'en');
}

/** Reactive accessor: returns the copy bundle for the active language. */
export function t(): Copy {
  return dict[lang()];
}
