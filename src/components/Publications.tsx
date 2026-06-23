import { createEffect, createMemo, createSignal, For, on, Show } from 'solid-js';
import type { Publication } from '../types';
import { venueSeriesList } from '../venues';
import { searchQuery, setSearchQuery, externalTick } from '../search';
import { reveal } from '../reveal';
import { t } from '../i18n';
import PublicationCard from './PublicationCard';
import './Publications.css';

const ALL = 'All';
const PER_PAGE = 12;

export default function Publications(props: { pubs: Publication[] }) {
  const [year, setYear] = createSignal<number | typeof ALL>(ALL);
  const [venue, setVenue] = createSignal<string>(ALL);
  const [awardsOnly, setAwardsOnly] = createSignal(false);
  const [page, setPage] = createSignal(1);

  // An external search (About tag, hero unit) clears the other filters so the
  // searched paper is the only result.
  createEffect(
    on(externalTick, () => {
      setYear(ALL);
      setVenue(ALL);
      setAwardsOnly(false);
    }, { defer: true })
  );

  const years = createMemo(() =>
    Array.from(new Set(props.pubs.map((p) => p.year))).sort((a, b) => b - a)
  );
  const venues = createMemo(() =>
    Array.from(new Set(props.pubs.flatMap((p) => venueSeriesList(p)))).sort()
  );
  const awardCount = createMemo(() => props.pubs.filter((p) => p.titleKey?.length).length);

  const filtered = createMemo(() => {
    const q = searchQuery().trim().toLowerCase();
    const y = year();
    const v = venue();
    const aw = awardsOnly();
    return props.pubs.filter((p) => {
      if (y !== ALL && p.year !== y) return false;
      if (v !== ALL && !venueSeriesList(p).includes(v)) return false;
      if (aw && !p.titleKey?.length) return false;
      if (q) {
        const hay = (
          p.title + ' ' + p.authors.join(' ') + ' ' + p.venue.join(' ')
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  const pageCount = createMemo(() => Math.max(1, Math.ceil(filtered().length / PER_PAGE)));
  // Reset to first page whenever the filtered set changes shape.
  createEffect(() => {
    filtered();
    setPage(1);
  });
  const paged = createMemo(() => {
    const start = (page() - 1) * PER_PAGE;
    return filtered().slice(start, start + PER_PAGE);
  });

  const goTo = (n: number) => {
    setPage(Math.min(pageCount(), Math.max(1, n)));
    document.getElementById('publications')?.scrollIntoView({ behavior: 'smooth' });
  };

  const pageItems = createMemo<(number | '…')[]>(() => {
    const total = pageCount();
    const cur = page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out: (number | '…')[] = [1];
    const lo = Math.max(2, cur - 1);
    const hi = Math.min(total - 1, cur + 1);
    if (lo > 2) out.push('…');
    for (let i = lo; i <= hi; i++) out.push(i);
    if (hi < total - 1) out.push('…');
    out.push(total);
    return out;
  });

  return (
    <section id="publications" class="section pubs">
      <div class="container">
        <div class="section-head" ref={reveal}>
          <span class="eyebrow">{t().pubs.eyebrow}</span>
          <h2>{t().pubs.heading}</h2>
          <p>{t().pubs.intro(props.pubs.length)}</p>
        </div>

        <div class="pubs__controls" ref={reveal}>
          <div class="pubs__search">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4" stroke-linecap="round"/></svg>
            <input
              type="search"
              placeholder={t().pubs.search}
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
            />
          </div>

          <select class="pubs__select" value={String(venue())} onChange={(e) => setVenue(e.currentTarget.value)}>
            <option value={ALL}>{t().pubs.allVenues}</option>
            <For each={venues()}>{(v) => <option value={v}>{v}</option>}</For>
          </select>

          <button
            class="pubs__award-filter"
            classList={{ active: awardsOnly() }}
            onClick={() => setAwardsOnly((v) => !v)}
            aria-pressed={awardsOnly()}
          >
            ★ {t().pubs.awardPapers}
            <span class="pubs__award-count">{awardCount()}</span>
          </button>
        </div>

        <div class="pubs__years" ref={reveal}>
          <button classList={{ active: year() === ALL }} onClick={() => setYear(ALL)}>{t().pubs.allYears}</button>
          <For each={years()}>
            {(y) => (
              <button classList={{ active: year() === y }} onClick={() => setYear(y)}>{y}</button>
            )}
          </For>
        </div>

        <p class="pubs__count">
          {t().pubs.showing(paged().length, filtered().length, filtered().length !== props.pubs.length)}
        </p>

        <Show
          when={filtered().length}
          fallback={<p class="pubs__empty">{t().pubs.empty}</p>}
        >
          <div class="pubs__list">
            <For each={paged()}>
              {(p, i) => <PublicationCard pub={p} index={i()} />}
            </For>
          </div>

          <Show when={pageCount() > 1}>
            <nav class="pubs__pager" aria-label="Publication pages">
              <button
                class="pubs__pager-btn"
                disabled={page() === 1}
                onClick={() => goTo(page() - 1)}
                aria-label={t().pubs.prevPage}
              >‹</button>
              <For each={pageItems()}>
                {(it) =>
                  it === '…' ? (
                    <span class="pubs__pager-gap">…</span>
                  ) : (
                    <button
                      class="pubs__pager-btn"
                      classList={{ active: page() === it }}
                      onClick={() => goTo(it)}
                    >{it}</button>
                  )
                }
              </For>
              <button
                class="pubs__pager-btn"
                disabled={page() === pageCount()}
                onClick={() => goTo(page() + 1)}
                aria-label={t().pubs.nextPage}
              >›</button>
            </nav>
          </Show>
        </Show>
      </div>
    </section>
  );
}
