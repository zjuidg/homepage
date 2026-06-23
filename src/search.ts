import { createSignal } from 'solid-js';

/**
 * Shared publication-search state so other sections (the About work tags, the
 * hero unit chart) can drive the publication list: set the query, clear other
 * filters, and scroll the list into view.
 */
const [searchQuery, setSearchQuery] = createSignal('');
const [externalTick, setExternalTick] = createSignal(0);

export { searchQuery, setSearchQuery, externalTick };

/** Jump to the publication list filtered to a single term (e.g. a paper name). */
export function searchPublications(term: string) {
  setSearchQuery(term);
  setExternalTick((n) => n + 1); // signals Publications to reset venue/year/award filters
  requestAnimationFrame(() => {
    document.getElementById('publications')?.scrollIntoView({ behavior: 'smooth' });
  });
}
