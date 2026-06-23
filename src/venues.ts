import { Venue, type Publication } from './types';

/**
 * Color encodes venue. The five most frequent venue *groups* each get a distinct
 * color; everything else is gray. Computed from the data so the legend always
 * reflects the actual top venues.
 */
const TOP_COLORS = ['#5b8cff', '#2fe6d6', '#b07cff', '#ffb454', '#ff6b9d'];
export const OTHER_COLOR = '#7a8499';
export const OTHER_ID = 'other';

const FULL_VENUE_NAMES: Partial<Record<Venue, string>> = {
  [Venue.TVCG]: 'IEEE Transactions on Visualization and Computer Graphics',
  [Venue.CGF]: 'Computer Graphics Forum',
  [Venue.TITS]: 'IEEE Transactions on Intelligent Transportation Systems',
  [Venue.TIST]: 'ACM Transactions on Intelligent Systems and Technology',
  [Venue.TBD]: 'IEEE Transactions on Big Data',
  [Venue.TMM]: 'IEEE Transactions on Multimedia',
  [Venue.IMWUT]:
    'Proceedings of the ACM on Interactive, Mobile, Wearable and Ubiquitous Technologies',
};

/** Reader-facing venue name. JSON keeps compact labels for filtering and data stability. */
export function venueDisplayName(label: string): string {
  const exact = FULL_VENUE_NAMES[label as Venue];
  if (exact) return exact;

  const yearSuffix = (prefix: string, full: string, separator = ', ') => {
    const match = label.match(new RegExp(`^${prefix} ((?:19|20)\\d{2})(.*)$`));
    if (!match) return null;
    const [, year, suffix] = match;
    return `${full}${separator}${year}${suffix}`;
  };

  return (
    yearSuffix('AAAI', 'AAAI Conference on Artificial Intelligence') ??
    yearSuffix('CHI', 'ACM CHI Conference on Human Factors in Computing Systems') ??
    yearSuffix('EuroVis', 'Eurographics Conference on Visualization') ??
    yearSuffix('IEEE VIS', 'IEEE VIS', ' ') ??
    yearSuffix('IEEE VR', 'IEEE Conference on Virtual Reality and 3D User Interfaces') ??
    yearSuffix('KDD', 'ACM SIGKDD Conference on Knowledge Discovery and Data Mining') ??
    yearSuffix('PacificVis', 'IEEE PacificVis', ' ') ??
    yearSuffix('SIGGRAPH', 'ACM SIGGRAPH', ' ') ??
    yearSuffix('SIGSPATIAL', 'ACM SIGSPATIAL', ' ') ??
    yearSuffix('UIST', 'ACM Symposium on User Interface Software and Technology (UIST)') ??
    label
  );
}

/** Strip a trailing year (and anything after it) from a venue label. */
function series(label: string): string {
  return label.replace(/\s*(?:19|20)\d{2}.*$/, '').trim() || label;
}

/**
 * The group a paper counts/filters as: "IEEE TVCG" when archived in TVCG (so
 * IEEE VIS / PacificVis-journal papers fold together), otherwise the year-less
 * series of its conference (e.g. "IEEE VIS 2024" → "IEEE VIS").
 */
export function venueGroup(p: Publication): string {
  if (p.venue.includes(Venue.TVCG)) return Venue.TVCG;
  const conf = p.venue.find((v) => /(?:19|20)\d{2}/.test(v));
  return series(conf ?? p.venue[0] ?? 'Other');
}

/**
 * Every venue series a paper belongs to, for filtering — so an IEEE VIS paper
 * archived in TVCG (`["IEEE TVCG", "IEEE VIS 2024"]`) is found under *both*
 * "IEEE TVCG" and "IEEE VIS". Year is stripped (e.g. "IEEE VIS 2024" → "IEEE VIS").
 */
export function venueSeriesList(p: Publication): string[] {
  return [...new Set(p.venue.map(series))];
}

export interface VenueScale {
  legend: { id: string; label: string; color: string }[];
  /** rank used to order marks within a column (0 = most common, top-5 first) */
  rank: (group: string) => number;
  lookup: (group: string) => { id: string; color: string };
}

export function venueScale(pubs: Publication[]): VenueScale {
  const counts = new Map<string, number>();
  for (const p of pubs) {
    const g = venueGroup(p);
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }

  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5);

  const colorByGroup = new Map<string, string>();
  const rankByGroup = new Map<string, number>();
  top.forEach(([g], i) => {
    colorByGroup.set(g, TOP_COLORS[i]);
    rankByGroup.set(g, i);
  });

  const legend = top.map(([g]) => ({ id: g, label: g, color: colorByGroup.get(g)! }));
  legend.push({ id: OTHER_ID, label: 'Other venues', color: OTHER_COLOR });

  return {
    legend,
    rank: (group) => rankByGroup.get(group) ?? top.length,
    lookup: (group) =>
      colorByGroup.has(group)
        ? { id: group, color: colorByGroup.get(group)! }
        : { id: OTHER_ID, color: OTHER_COLOR },
  };
}
