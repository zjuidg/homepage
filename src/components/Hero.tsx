import { createMemo, createSignal, For, Show } from 'solid-js';
import type { Publication } from '../types';
import { venueGroup, venueScale } from '../venues';
import { searchPublications } from '../search';
import { t } from '../i18n';
import './Hero.css';

interface Props {
  pubs?: Publication[];
}

// unit-chart geometry (SVG user units; the svg scales to its container)
const CELL = 10;
const GAP = 3;
const COLS = 3; // units per row, within one year
const YEAR_GAP = 14;
const PAD_T = 12;
const AXIS = 24;

const blockW = COLS * CELL + (COLS - 1) * GAP;
const yearPitch = blockW + YEAR_GAP;

export default function Hero(props: Props) {
  const [hot, setHot] = createSignal<string | null>(null);
  const [tip, setTip] = createSignal<{ x: number; y: number; title: string; venue: string } | null>(null);
  let figEl: HTMLElement | undefined;
  const pubs = () => props.pubs ?? [];
  const scale = createMemo(() => venueScale(pubs()));

  const showTip = (e: MouseEvent, m: { title: string; venue: string }) => {
    if (!figEl) return;
    const r = figEl.getBoundingClientRect();
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top, title: m.title, venue: m.venue });
  };

  const maxRows = createMemo(() => {
    const totals = new Map<number, number>();
    for (const p of pubs()) totals.set(p.year, (totals.get(p.year) ?? 0) + 1);
    return Math.max(1, ...[...totals.values()].map((n) => Math.ceil(n / COLS)));
  });

  // one block per year; each paper is a positioned square (sorted by venue rank,
  // packed into COLS columns, filled bottom row first)
  const columns = createMemo(() => {
    const sc = scale();
    const byYear = new Map<number, Publication[]>();
    for (const p of pubs()) {
      if (!byYear.has(p.year)) byYear.set(p.year, []);
      byYear.get(p.year)!.push(p);
    }
    const baseY = PAD_T + maxRows() * (CELL + GAP);
    return [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, papers], xi) => {
        const xLeft = xi * yearPitch;
        const sorted = papers
          .map((p) => ({ p, m: sc.lookup(venueGroup(p)) }))
          .sort((a, b) => sc.rank(a.m.id) - sc.rank(b.m.id));
        const marks = sorted.map(({ p, m }, k) => {
          const col = k % COLS;
          const row = Math.floor(k / COLS);
          return {
            x: xLeft + col * (CELL + GAP),
            y: baseY - (row + 1) * (CELL + GAP),
            color: m.color,
            id: m.id,
            title: p.title,
            venue: p.venue.join(' · '),
          };
        });
        return { year, cx: xLeft + blockW / 2, marks };
      });
  });

  const venueCount = createMemo(() => new Set(pubs().map((p) => venueGroup(p))).size);
  const width = () => Math.max(1, columns().length) * yearPitch - YEAR_GAP;
  const height = () => PAD_T + maxRows() * (CELL + GAP) + AXIS;
  const axisY = () => PAD_T + maxRows() * (CELL + GAP) + 17;

  return (
    <section id="top" class="hero">
      <div class="container hero__inner">
        <p class="eyebrow hero__eyebrow">{t().hero.eyebrow}</p>

        <h1 class="hero__title">
          <span>{t().hero.title1}</span>
          <span class="hero__title-em">{t().hero.title2}</span>
        </h1>

        <p class="hero__lead">{t().hero.lead}</p>

        <div class="hero__actions">
          <a class="btn btn--primary" href="#publications">
            {t().hero.explore}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
          <a class="btn btn--ghost" href="#about">{t().hero.aboutCta}</a>
        </div>

        {/* the masthead: every published paper, one square, by year & venue */}
        <figure class="hero__archive" ref={figEl}>
          <figcaption class="hero__legend">
            <For each={scale().legend}>
              {(item) => (
                <button
                  type="button"
                  class="hero__legend-item"
                  classList={{ dim: hot() !== null && hot() !== item.id }}
                  onMouseEnter={() => setHot(item.id)}
                  onMouseLeave={() => setHot(null)}
                  onFocus={() => setHot(item.id)}
                  onBlur={() => setHot(null)}
                >
                  <span class="hero__swatch" style={{ background: item.color }} />
                  {item.label}
                </button>
              )}
            </For>
          </figcaption>

          <Show when={columns().length} fallback={<div class="hero__archive-skeleton" />}>
            <svg
              class="hero__chart"
              viewBox={`0 0 ${width()} ${height()}`}
              preserveAspectRatio="xMidYMax meet"
              role="img"
              aria-label={t().hero.archiveAria(pubs().length)}
            >
              <For each={columns()}>
                {(col) => (
                  <g>
                    <For each={col.marks}>
                      {(m) => (
                        <rect
                          class="hero__mark"
                          classList={{ dim: hot() !== null && hot() !== m.id }}
                          x={m.x}
                          y={m.y}
                          width={CELL}
                          height={CELL}
                          rx={2}
                          fill={m.color}
                          onMouseEnter={(e) => showTip(e, m)}
                          onMouseMove={(e) => showTip(e, m)}
                          onMouseLeave={() => setTip(null)}
                          onClick={() => searchPublications(m.title)}
                        />
                      )}
                    </For>
                    <text class="hero__year" x={col.cx} y={axisY()} text-anchor="middle">
                      {`'${String(col.year).slice(2)}`}
                    </text>
                  </g>
                )}
              </For>
            </svg>
          </Show>

          <Show when={tip()}>
            {(tp) => (
              <div class="hero__tip" style={{ left: `${tp().x}px`, top: `${tp().y}px` }}>
                <span class="hero__tip-title">{tp().title}</span>
                <span class="hero__tip-venue">{tp().venue}</span>
              </div>
            )}
          </Show>
        </figure>

        <dl class="hero__stats">
          <div>
            <dt>2015</dt>
            <dd>{t().hero.stats.founded}</dd>
          </div>
          <div>
            <dt>{pubs().length || '—'}</dt>
            <dd>{t().hero.stats.publications}</dd>
          </div>
          <div>
            <dt>{venueCount() || '—'}</dt>
            <dd>{t().hero.stats.venues}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
