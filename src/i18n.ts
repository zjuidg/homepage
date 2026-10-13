import { createSignal } from 'solid-js';
import type { PublicationCategory } from './types';

export type Lang = 'en' | 'zh';

const KEY = 'idg-lang';

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
    archiveAria: (n: number) => string;
    otherVenues: string;
    stats: { publications: string; venues: string; founded: string };
  };
  about: {
    eyebrow: string;
    headingPre: string;
    headingEm: string;
    headingPost: string;
    body: string;
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
  map: {
    heading: string;
    intro: string;
    stats: (n: number, topics: number) => string;
    hint: string;
    topics: string;
    allTopics: string;
    zoomIn: string;
    zoomOut: string;
    resetView: string;
    unavailable: string;
    topicStats: (n: number, share: number) => string;
    categories: Record<PublicationCategory, string>;
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
    alsoAppearsIn: (venue: string) => string;
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
    lead: 'We build visualization, visual analytics, and interaction techniques that help people make sense of large, complex data — in sports analytics, social media, and urban informatics.',
    explore: 'Explore publications',
    aboutCta: 'About the group',
    archiveAria: (n) =>
      `Unit chart: each of ${n} publications drawn as one square, stacked by year. CCF-A venues have distinct colors; all others are gray.`,
    otherVenues: 'Other venues',
    stats: { publications: 'Publications', venues: 'Venues', founded: 'Founded' },
  },
  about: {
    eyebrow: 'About us',
    headingPre: 'From expressive visualization to ',
    headingEm: 'human–AI interaction',
    headingPost: '',
    body: 'Founded in 2015 within the State Key Lab of CAD&CG at Zhejiang University, the Interactive Data Group builds visualization, visual analytics, and interaction techniques — declarative authoring grammars, human-in-the-loop analysis systems, immersive and situated analytics, and interfaces that keep large models steerable. The work stays grounded in real domains: sports analytics, social media, and urban data.',
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
  map: {
    heading: 'Our research, by topic',
    intro:
      'Each region is a research topic. Topics with more papers generally occupy more space. Nearby papers share related ideas. Hover a paper cell for details, or select it to find the paper below.',
    stats: (n, topics) => `${n} papers · ${topics} topics`,
    hint: 'Hover a paper cell for details. Select the cell to find the paper below. Zoom and drag to explore.',
    topics: 'Research topics',
    allTopics: 'All topics',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetView: 'Reset view',
    unavailable: 'The paper map is unavailable. You can still browse all publications below.',
    topicStats: (n, share) => `${n} papers · ${share.toFixed(1)}% of the collection`,
    categories: {
      'sports-analytics': 'Sports Analytics',
      'urban-geospatial': 'Geospatial Analytics',
      'social-behavior': 'Social Behavior',
      'data-wrangling': 'Data Wrangling',
      'visualization-design': 'Visualization Design',
      'time-series-analysis': 'Time Series Analysis',
      'causal-analysis': 'Causal Analysis',
      'graph-analytics': 'Graph Analytics',
      'perception-interaction': 'Perception and Interaction',
      'research-evaluation': 'Research Evaluation',
      'multimodal-analytics': 'Multimodal Analytics',
      'model-mechanisms': 'Model Mechanisms',
      'cultural-heritage': 'Culture and Art',
      'industrial-analytics': 'Industrial Operations',
      'health-analytics': 'Health Analytics',
    },
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
    alsoAppearsIn: (venue) => `(also appears in ${venue})`,
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
    lead: '我们研究信息可视化、可视分析与人机交互技术，帮助人们理解大规模、复杂的数据——涵盖体育分析、社交媒体与城市信息学等领域。',
    explore: '浏览论文',
    aboutCta: '了解课题组',
    archiveAria: (n) => `单元图：${n} 篇论文，每篇对应一个方块，按年份堆叠。CCF-A 类期刊与会议以不同颜色显示，其余为灰色。`,
    otherVenues: '其他期刊与会议',
    stats: { publications: '学术论文', venues: '期刊与会议', founded: '成立年份' },
  },
  about: {
    eyebrow: '关于我们',
    headingPre: '从富有表现力的可视化到',
    headingEm: '人机智能交互',
    headingPost: '',
    body: 'Interactive Data Group 成立于 2015 年，隶属于浙江大学计算机辅助设计与图形系统全国重点实验室。我们研究可视化、可视分析与交互技术——声明式创作语法、人在回路的分析系统、沉浸式与情境化分析，以及让大模型保持可控的交互界面，并始终扎根于体育分析、社交媒体与城市数据等真实场景。',
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
  map: {
    heading: '按主题探索我们的研究',
    intro:
      '每个区域代表一个研究主题，论文较多的主题通常占据更大区域。位置相近的论文研究内容相关。悬停论文分区查看详情，点击分区可在下方找到论文。',
    stats: (n, topics) => `${n} 篇论文 · ${topics} 个主题`,
    hint: '悬停论文分区查看详情，点击分区可在下方找到论文。可放大和拖动地图。',
    topics: '研究主题',
    allTopics: '全部主题',
    zoomIn: '放大',
    zoomOut: '缩小',
    resetView: '重置视图',
    unavailable: '论文地图暂时无法加载，可继续浏览下方论文列表。',
    topicStats: (n, share) => `${n} 篇论文 · 占全部论文的 ${share.toFixed(1)}%`,
    categories: {
      'sports-analytics': '体育分析',
      'urban-geospatial': '地理空间分析',
      'social-behavior': '社会行为',
      'data-wrangling': '数据整理',
      'visualization-design': '可视化设计',
      'time-series-analysis': '时序分析',
      'causal-analysis': '因果分析',
      'graph-analytics': '图网络分析',
      'perception-interaction': '感知交互',
      'research-evaluation': '研究评估',
      'multimodal-analytics': '多模态分析',
      'model-mechanisms': '模型机理',
      'cultural-heritage': '文化艺术',
      'industrial-analytics': '工业运营',
      'health-analytics': '健康分析',
    },
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
    alsoAppearsIn: (venue) => `（同时发表于 ${venue}）`,
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
