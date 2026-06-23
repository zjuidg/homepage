import { createMemo, createResource, createSignal, For, Show } from 'solid-js';
import type { Publication } from '../types';
import { loadPaperMap } from '../data';
import { venueChipLabel, venueGroup, venueScale, OTHER_ID } from '../venues';
import { searchPublications } from '../search';
import { reveal } from '../reveal';
import { t } from '../i18n';
import './PaperMap.css';

// SVG user-space canvas; the svg scales to its container.
const W = 1000;
const H = 680;
const PAD = 44; // keep dots clear of the edges
const R = 5.5; // dot radius
const COLLIDE_PAD = 3.5; // extra gap kept between dot edges
const SHARED_MIN = 3; // draw a link when two papers share at least this many authors

interface MapNode {
  pub: Publication;
  x: number;
  y: number;
  ax: number; // UMAP anchor (semantic position) the relaxation springs back to
  ay: number;
  color: string;
  venueId: string;
  neighbors: Set<string>;
}

interface MapLink {
  source: MapNode;
  target: MapNode;
  shared: number;
}

/** Map a precomputed coordinate in [-1, 1] onto the padded SVG canvas. */
function place(v: number, size: number): number {
  return PAD + ((v + 1) / 2) * (size - 2 * PAD);
}

/**
 * Nudge overlapping dots apart while springing each back toward its semantic
 * (UMAP) anchor — so the layout reads as the embedding, just without dots piling
 * on top of one another. Deterministic: same input → same output.
 */
function relax(nodes: MapNode[]) {
  const minSep = 2 * R + COLLIDE_PAD;
  const minSep2 = minSep * minSep;
  const anchorK = 0.1;
  for (let iter = 0; iter < 160; iter++) {
    // collision: split the overlap and push each dot along the centre line
    for (let i = 0; i < nodes.length; i++) {
      const ni = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const nj = nodes[j];
        let dx = nj.x - ni.x;
        let dy = nj.y - ni.y;
        let d2 = dx * dx + dy * dy;
        if (d2 >= minSep2) continue;
        let dist = Math.sqrt(d2);
        if (dist < 1e-6) {
          // deterministically jitter coincident dots apart
          dx = ((i * 13 + j) % 5) - 2 || 1;
          dy = ((i * 7 + j) % 5) - 2 || 1;
          dist = Math.sqrt(dx * dx + dy * dy);
        }
        const push = (minSep - dist) / 2;
        const ox = (dx / dist) * push;
        const oy = (dy / dist) * push;
        ni.x -= ox;
        ni.y -= oy;
        nj.x += ox;
        nj.y += oy;
      }
    }
    // spring back toward the semantic anchor, then keep inside the canvas
    for (const n of nodes) {
      n.x += (n.ax - n.x) * anchorK;
      n.y += (n.ay - n.y) * anchorK;
      n.x = Math.min(W - PAD, Math.max(PAD, n.x));
      n.y = Math.min(H - PAD, Math.max(PAD, n.y));
    }
  }
}

export default function PaperMap(props: { pubs: Publication[] }) {
  const [points] = createResource(loadPaperMap);
  const [active, setActive] = createSignal<MapNode | null>(null);
  const [hotVenue, setHotVenue] = createSignal<string | null>(null);

  const scale = createMemo(() => venueScale(props.pubs));

  const layout = createMemo<{ nodes: MapNode[]; links: MapLink[] }>(() => {
    const pts = points();
    if (!pts) return { nodes: [], links: [] };
    const sc = scale();

    const nodes: MapNode[] = [];
    const authorSets: Set<string>[] = [];
    for (const pub of props.pubs) {
      const p = pts[pub.id];
      if (!p) continue; // paper added after the last precompute — skip
      const { id, color } = sc.lookup(venueGroup(pub));
      const ax = place(p[0], W);
      const ay = place(p[1], H);
      nodes.push({ pub, x: ax, y: ay, ax, ay, color, venueId: id, neighbors: new Set() });
      authorSets.push(new Set((pub.authors ?? []).filter(Boolean)));
    }

    // Link two papers that share at least SHARED_MIN authors.
    const links: MapLink[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let shared = 0;
        const small = authorSets[i].size < authorSets[j].size ? authorSets[i] : authorSets[j];
        const big = small === authorSets[i] ? authorSets[j] : authorSets[i];
        for (const a of small) if (big.has(a)) shared++;
        if (shared < SHARED_MIN) continue;
        links.push({ source: nodes[i], target: nodes[j], shared });
        nodes[i].neighbors.add(nodes[j].pub.id);
        nodes[j].neighbors.add(nodes[i].pub.id);
      }
    }

    relax(nodes);
    return { nodes, links };
  });

  const legend = createMemo(() =>
    scale().legend.map((item) =>
      item.id === OTHER_ID ? { ...item, label: t().map.otherVenues } : item
    )
  );

  const isDim = (n: MapNode): boolean => {
    const hv = hotVenue();
    if (hv !== null) return n.venueId !== hv;
    const a = active();
    if (a !== null) return a.pub.id !== n.pub.id && !a.neighbors.has(n.pub.id);
    return false;
  };
  const isHot = (n: MapNode): boolean => {
    const hv = hotVenue();
    if (hv !== null) return n.venueId === hv;
    const a = active();
    return a !== null && (a.pub.id === n.pub.id || a.neighbors.has(n.pub.id));
  };

  return (
    <section id="map" class="section mapsec">
      <div class="container">
        <div class="section-head" ref={reveal}>
          <span class="eyebrow">{t().map.eyebrow}</span>
          <h2>{t().map.heading}</h2>
          <p>{t().map.intro}</p>
        </div>

        <div class="map__controls" ref={reveal}>
          <ul class="map__legend" aria-label="Venues">
            <For each={legend()}>
              {(item) => (
                <li>
                  <button
                    type="button"
                    class="map__legend-item"
                    classList={{ dim: hotVenue() !== null && hotVenue() !== item.id }}
                    onMouseEnter={() => setHotVenue(item.id)}
                    onMouseLeave={() => setHotVenue(null)}
                    onFocus={() => setHotVenue(item.id)}
                    onBlur={() => setHotVenue(null)}
                  >
                    <span class="map__swatch" style={{ background: item.color }} />
                    {item.label}
                  </button>
                </li>
              )}
            </For>
          </ul>
          <p class="map__stats">{t().map.stats(layout().nodes.length)}</p>
        </div>

        <div class="map__stage" ref={reveal}>
          <svg
            class="map__svg"
            classList={{ 'is-focused': hotVenue() !== null || active() !== null }}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={t().map.heading}
          >
            <g class="map__links">
              <For each={layout().links}>
                {(l) => (
                  <line
                    class="map__link"
                    classList={{
                      hot:
                        active() !== null &&
                        (active()!.pub.id === l.source.pub.id ||
                          active()!.pub.id === l.target.pub.id),
                    }}
                    x1={l.source.x.toFixed(1)}
                    y1={l.source.y.toFixed(1)}
                    x2={l.target.x.toFixed(1)}
                    y2={l.target.y.toFixed(1)}
                    style={{
                      // resting opacity climbs with shared authors: 3 is barely
                      // visible, rare high-overlap pairs read more strongly. The
                      // hover/focus rules override this with !important.
                      'stroke-opacity': Math.min(0.6, 0.04 + (l.shared - SHARED_MIN) * 0.085),
                      'stroke-width': `${Math.min(1.4, 0.4 + l.shared * 0.25)}px`,
                    }}
                  />
                )}
              </For>
            </g>
            <g class="map__nodes">
              <For each={layout().nodes}>
                {(n) => (
                  <g
                    class="map__node"
                    classList={{ hot: isHot(n), dim: isDim(n) }}
                    transform={`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`}
                    role="button"
                    tabIndex={0}
                    aria-label={n.pub.title}
                    onPointerEnter={() => setActive(n)}
                    onPointerLeave={() => setActive((cur) => (cur === n ? null : cur))}
                    onFocus={() => setActive(n)}
                    onBlur={() => setActive((cur) => (cur === n ? null : cur))}
                    onClick={() => searchPublications(n.pub.title)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        searchPublications(n.pub.title);
                      }
                    }}
                  >
                    <circle class="map__halo" r={R + 6} />
                    <circle class="map__dot" r={R} style={{ fill: n.color, color: n.color }} />
                  </g>
                )}
              </For>
            </g>
          </svg>

          <div class="map__readout" classList={{ 'is-active': !!active() }}>
            <Readout node={active()} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Readout(props: { node: MapNode | null }) {
  const n = () => props.node;
  return (
    <Show when={n()} fallback={<p class="map__hint">{t().map.hint}</p>}>
      {(node) => (
        <div class="map__card">
          <span class="map__card-dot" style={{ background: node().color, color: node().color }} />
          <div class="map__card-body">
            <strong class="map__card-title">{node().pub.title}</strong>
            <span class="map__card-meta">
              {node().pub.authors[0]}
              {node().pub.authors.length > 1 ? ' et al.' : ''} · {node().pub.year} ·{' '}
              {node().pub.venue.map(venueChipLabel).join(' · ')}
              <Show when={node().neighbors.size}>
                {' '}
                · {t().map.linked(node().neighbors.size)}
              </Show>
            </span>
          </div>
        </div>
      )}
    </Show>
  );
}
