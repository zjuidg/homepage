import { Venue, type Publication } from './types';
import { OTHER_COLOR, OTHER_ID, type VenueScale } from './venues';

// CCF-A venues represented in our data, checked against the CCF directory:
// https://www.ccf.org.cn/Academic_Evaluation/CGAndMT/
// https://www.ccf.org.cn/Academic_Evaluation/HCIAndPC/
// https://www.ccf.org.cn/Academic_Evaluation/AI/
// https://www.ccf.org.cn/Academic_Evaluation/DM_CS/
// https://www.ccf.org.cn/Academic_Evaluation/NIS/
// https://www.ccf.org.cn/c/2017-03-15/587248.shtml (TOSEM)
// Fixed colors keep each venue consistent as publication counts change.
const CCF_A_COLORS = new Map<string, string>([
  [Venue.TVCG, '#5b8cff'],
  [Venue.TOSEM, '#a4cf9a'],
  ['CHI', '#b07cff'],
  ['UIST', '#ff6b9d'],
  ['AAAI', '#ffb454'],
  ['KDD', '#2fe6d6'],
  ['IEEE VIS', '#8bd450'],
  [Venue.IMWUT, '#e8cf66'],
  ['ACL', '#63c6ff'],
  ['CCS', '#c99673'],
  ['ICML', '#ed7777'],
  ['IEEE VR', '#eaa1e6'],
  ['ACM MM', '#46b995'],
  ['SIGGRAPH', '#9ba7ff'],
]);

// CCF conference listings cover full/regular papers, not these other tracks.
const NON_REGULAR_TRACK = /\b(short(?: paper)?|demo|technical brief|summary|findings|workshop|poster|art gallery)\b/i;

/** CCF-A group used by the hero chart, with archival TVCG taking priority. */
export function ccfAVenueGroup(p: Publication): string {
  if (p.venue.includes(Venue.TVCG)) return Venue.TVCG;

  for (const venue of p.venue) {
    if (NON_REGULAR_TRACK.test(venue)) continue;
    const series = venue.replace(/\s*(?:19|20)\d{2}.*$/, '').trim();
    // SciVis was one of the conferences within IEEE VIS before unification.
    const group = series === 'IEEE SciVis' ? 'IEEE VIS' : series;
    if (CCF_A_COLORS.has(group)) return group;
  }
  return OTHER_ID;
}

/** Show every represented CCF-A venue; all remaining publications share gray. */
export function ccfAVenueScale(pubs: Publication[]): VenueScale {
  const counts = new Map<string, number>();
  for (const pub of pubs) {
    const group = ccfAVenueGroup(pub);
    if (group !== OTHER_ID) counts.set(group, (counts.get(group) ?? 0) + 1);
  }

  const groups = [...counts.keys()].sort(
    (a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b),
  );
  const ranks = new Map(groups.map((group, i) => [group, i]));
  const legend = groups.map((group) => ({
    id: group,
    label: group,
    color: CCF_A_COLORS.get(group)!,
  }));
  legend.push({ id: OTHER_ID, label: 'Other venues', color: OTHER_COLOR });

  return {
    legend,
    rank: (group) => ranks.get(group) ?? groups.length,
    lookup: (group) => {
      const color = CCF_A_COLORS.get(group);
      return color ? { id: group, color } : { id: OTHER_ID, color: OTHER_COLOR };
    },
  };
}
