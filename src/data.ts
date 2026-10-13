import { Venue, type Publication, type PublicationCategory, type Slide } from './types';

const base = import.meta.env.BASE_URL || '/';

/**
 * Paper PDFs are hosted on Cloudflare R2 (they are too large to bundle/deploy).
 * When VITE_PAPERS_BASE is set, paper paths resolve against that origin; the
 * R2 object keys mirror the local layout minus the leading "source/".
 */
const papersBase = (import.meta.env.VITE_PAPERS_BASE || '').replace(/\/$/, '');

/** Resolve a data-relative path (e.g. "source/foo.png") against the app base. */
export function asset(p?: string): string {
  if (!p) return '';
  if (/^https?:\/\//.test(p)) return p;
  return base.replace(/\/$/, '') + '/' + p.replace(/^\.?\//, '');
}

/** Resolve a publication's paper PDF — from R2 when configured, else locally. */
export function paperUrl(p?: string): string {
  if (!p) return '';
  if (/^https?:\/\//.test(p)) return p;
  if (papersBase) return `${papersBase}/${p.replace(/^\.?\//, '').replace(/^source\//, '')}`;
  return asset(p);
}

async function getJSON<T>(file: string): Promise<T> {
  const res = await fetch(asset(`source/${file}`));
  if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
  return res.json();
}

export async function loadPublications(): Promise<Publication[]> {
  const pubs = await getJSON<Publication[]>('publications.json');
  return pubs.slice().sort((a, b) => (b.year || 0) - (a.year || 0));
}

export async function loadFeatured(): Promise<string[]> {
  return getJSON<string[]>('featuredProj.json');
}

export async function loadSlides(): Promise<Slide[]> {
  return getJSON<Slide[]>('slides.json');
}

export type MapCoordinate = [number, number];
export interface MapLabel {
  x: number;
  y: number;
  size: number;
  lines: string[];
  width: number;
  height: number;
  angle: number;
}
export interface MapRegion {
  category: PublicationCategory;
  count: number;
  area: number;
  paperShare: number;
  rings: MapCoordinate[][];
  labels: Record<'en' | 'zh', MapLabel>;
}
/** Precomputed semantic node layout and merged ordinary Voronoi cells. */
export interface PaperMap {
  width: number;
  height: number;
  papers: { id: string; category: PublicationCategory; x: number; y: number; cell: MapCoordinate[] }[];
  regions: MapRegion[];
  coast: MapCoordinate[];
  borders: [MapCoordinate, MapCoordinate][];
  subdivisions: [MapCoordinate, MapCoordinate][];
}

export async function loadPaperMap(): Promise<PaperMap> {
  return getJSON<PaperMap>('paper-topic-map.json');
}

/**
 * True when a paper is archived in TVCG. IEEE VIS and the PacificVis journal
 * track carry Venue.TVCG alongside their conference venue (see the migration in
 * Venue), so this is a simple membership check.
 */
export function isTVCG(p: Publication): boolean {
  return p.venue.includes(Venue.TVCG);
}

/** External link for a publication, preferring DOI then video then demo. */
export function doiUrl(p: Publication): string {
  const d = p.doi || p.DOI;
  if (!d) return '';
  return /^https?:\/\//.test(d) ? d : `https://doi.org/${d}`;
}
