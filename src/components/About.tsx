import { createMemo, createSignal, For, Show } from 'solid-js';
import type { Publication } from '../types';
import { reveal } from '../reveal';
import { searchPublications } from '../search';
import { t } from '../i18n';
import './About.css';

// Three representative systems per area — real system names from prestigious
// venues (TVCG / VIS / CHI), kept untranslated like paper titles. Each name is a
// unique search term, so clicking it isolates that paper in the list. Order
// matches t().about.areas.
const recent: string[][] = [
  ['ChartGPT', 'Nebula', 'TableCanoniser'],
  ['PassVizor', 'SmartAdP', 'VideoModerator'],
  ['AdversaFlow', 'KEditVis', 'Smartboard'],
];

const TIP_WIDTH = 280;
const TIP_MARGIN = 12;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function About(props: { pubs?: Publication[] }) {
  const [tip, setTip] = createSignal<{ x: number; y: number; title: string; venue: string } | null>(null);
  let gridEl: HTMLDivElement | undefined;

  // Map each tag (a unique system name) to its paper's full title + venue.
  const tagInfo = createMemo(() => {
    const pubs = props.pubs ?? [];
    const map = new Map<string, { title: string; venue: string }>();
    for (const names of recent) {
      for (const name of names) {
        const p = pubs.find((pp) => pp.title.toLowerCase().includes(name.toLowerCase()));
        if (p) map.set(name, { title: p.title, venue: p.venue.join(' · ') });
      }
    }
    return map;
  });

  const showTip = (e: MouseEvent, name: string) => {
    const info = tagInfo().get(name);
    if (!info || !gridEl) return;
    const r = gridEl.getBoundingClientRect();
    const tipWidth = Math.min(TIP_WIDTH, Math.max(0, r.width - TIP_MARGIN * 2));
    const minX = TIP_MARGIN + tipWidth / 2;
    const maxX = r.width - TIP_MARGIN - tipWidth / 2;
    const rawX = e.clientX - r.left;
    const x = minX <= maxX ? clamp(rawX, minX, maxX) : r.width / 2;
    setTip({ x, y: e.clientY - r.top, title: info.title, venue: info.venue });
  };

  return (
    <section id="about" class="section about">
      <div class="container">
        <div class="section-head" ref={reveal}>
          <span class="eyebrow">{t().about.eyebrow}</span>
          <h2>
            {t().about.headingPre}
            <span class="gradient-text">{t().about.headingEm}</span>
            {t().about.headingPost}
          </h2>
          <p>{t().about.body}</p>
        </div>

        <div class="about__grid" ref={gridEl}>
          <For each={t().about.areas}>
            {(a, i) => (
              <article
                class="about__card"
                ref={reveal}
                style={{ 'transition-delay': `${i() * 80}ms` }}
              >
                <span class="about__num">{String(i() + 1).padStart(2, '0')}</span>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
                <div class="about__recent">
                  <span class="about__recent-label">{t().about.recentLabel}</span>
                  <For each={recent[i()]}>
                    {(name) => (
                      <button
                        type="button"
                        class="about__tag"
                        onClick={() => searchPublications(name)}
                        onMouseEnter={(e) => showTip(e, name)}
                        onMouseMove={(e) => showTip(e, name)}
                        onMouseLeave={() => setTip(null)}
                      >
                        {name}
                      </button>
                    )}
                  </For>
                </div>
              </article>
            )}
          </For>

          <Show when={tip()}>
            {(tp) => (
              <div class="about__tip" style={{ left: `${tp().x}px`, top: `${tp().y}px` }}>
                <span class="about__tip-title">{tp().title}</span>
                <span class="about__tip-venue">{tp().venue}</span>
              </div>
            )}
          </Show>
        </div>
      </div>
    </section>
  );
}
