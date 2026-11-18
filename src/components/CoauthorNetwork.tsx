import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js';
import type { Publication } from '../types';
import { ForceSim, seedPositions, type SimLink, type SimNode } from '../force';
import { reveal } from '../reveal';
import { searchPublications } from '../search';
import { t } from '../i18n';
import './CoauthorNetwork.css';

const W = 1000;
const H = 680;
const LABEL_COUNT = 22; // how many top authors keep a permanent label
const CLICK_SLOP = 5;

interface GraphNode extends SimNode {
  name: string;
  papers: number;
  degree: number;
  showLabel: boolean;
  neighbors: Set<string>;
  el?: SVGGElement;
}

interface GraphLink extends SimLink {
  source: GraphNode;
  target: GraphNode;
  el?: SVGLineElement;
}

interface Graph {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Radius encodes paper count. Area should scale with the count (not radius), so
 * the radius scales with sqrt(papers) — this avoids the visual "squaring" that
 * makes prolific authors look disproportionately huge.
 */
function radiusFor(papers: number): number {
  return 4 + Math.sqrt(papers) * 2.8;
}

/** Build the co-authorship graph from publications, filtered to authors with ≥ minPapers. */
function buildGraph(pubs: Publication[], minPapers: number): Graph {
  const paperCount = new Map<string, number>();
  const edgeW = new Map<string, number>();

  for (const p of pubs) {
    const authors = Array.from(new Set(p.authors ?? [])).filter(Boolean);
    for (const a of authors) paperCount.set(a, (paperCount.get(a) ?? 0) + 1);
    const sorted = authors.slice().sort();
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const key = `${sorted[i]}\0${sorted[j]}`;
        edgeW.set(key, (edgeW.get(key) ?? 0) + 1);
      }
    }
  }

  const kept = Array.from(paperCount.entries())
    .filter(([, c]) => c >= minPapers)
    .sort((a, b) => b[1] - a[1]);
  const keptSet = new Set(kept.map(([n]) => n));

  const byName = new Map<string, GraphNode>();
  kept.forEach(([name, papers], idx) => {
    byName.set(name, {
      id: name,
      name,
      papers,
      degree: 0,
      showLabel: idx < LABEL_COUNT,
      neighbors: new Set<string>(),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: radiusFor(papers),
      fx: null,
      fy: null,
    });
  });

  const links: GraphLink[] = [];
  for (const [key, w] of edgeW) {
    const [a, b] = key.split('\0');
    if (!keptSet.has(a) || !keptSet.has(b)) continue;
    const source = byName.get(a)!;
    const target = byName.get(b)!;
    source.degree++;
    target.degree++;
    source.neighbors.add(b);
    target.neighbors.add(a);
    links.push({ source, target, w });
  }

  const nodes = Array.from(byName.values());
  seedPositions(nodes, W, H);
  return { nodes, links };
}

export default function CoauthorNetwork(props: { pubs: Publication[] }) {
  const [minPapers, setMinPapers] = createSignal(2);
  const [active, setActive] = createSignal<GraphNode | null>(null);

  const graph = createMemo(() => buildGraph(props.pubs, minPapers()));

  let svgRef!: SVGSVGElement;
  let viewRef!: SVGGElement;
  let sim: ForceSim | undefined;
  let raf = 0;
  let running = false;
  let dragNode: GraphNode | null = null;
  let dragStart = { x: 0, y: 0 };
  let dragMoved = false;
  let suppressClick = false;
  // background panning of the whole view
  let panning = false;
  let panX = 0;
  let panY = 0;
  let panPointerStart = { x: 0, y: 0 };
  let panOrigin = { x: 0, y: 0 };

  const startLoop = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(frame);
  };

  function frame() {
    if (!sim) {
      running = false;
      return;
    }
    const more = sim.tick();
    for (const n of sim.nodes as GraphNode[]) {
      n.el?.setAttribute('transform', `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`);
    }
    for (const l of sim.links as GraphLink[]) {
      const el = l.el;
      if (!el) continue;
      el.setAttribute('x1', l.source.x.toFixed(1));
      el.setAttribute('y1', l.source.y.toFixed(1));
      el.setAttribute('x2', l.target.x.toFixed(1));
      el.setAttribute('y2', l.target.y.toFixed(1));
    }
    if (more) raf = requestAnimationFrame(frame);
    else running = false;
  }

  // (Re)build the simulation whenever the threshold (graph) changes.
  createEffect(() => {
    const g = graph();
    cancelAnimationFrame(raf);
    running = false;
    setActive(null);
    sim = new ForceSim(g.nodes, g.links, { width: W, height: H });
    sim.reheat(1);
    startLoop();
  });

  onCleanup(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointermove', onPanMove);
    window.removeEventListener('pointerup', onPanUp);
  });

  /* ---- pointer → SVG user-space coords ---- */
  function toSvg(e: PointerEvent) {
    const ctm = svgRef.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = svgRef.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }
  // World coords account for the current pan offset (nodes live inside the panned group).
  function toWorld(e: PointerEvent) {
    const p = toSvg(e);
    return { x: p.x - panX, y: p.y - panY };
  }
  function applyPan() {
    viewRef.setAttribute('transform', `translate(${panX.toFixed(1)} ${panY.toFixed(1)})`);
  }

  /* ---- drag the background to pan the whole view ---- */
  function onPanDown(e: PointerEvent) {
    if (dragNode) return; // a node drag takes precedence
    panning = true;
    svgRef.classList.add('is-panning');
    try {
      svgRef.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore — capture is a nicety, panning still works via window listeners */
    }
    panPointerStart = toSvg(e);
    panOrigin = { x: panX, y: panY };
    window.addEventListener('pointermove', onPanMove);
    window.addEventListener('pointerup', onPanUp);
  }
  function onPanMove(e: PointerEvent) {
    if (!panning) return;
    const p = toSvg(e);
    panX = panOrigin.x + (p.x - panPointerStart.x);
    panY = panOrigin.y + (p.y - panPointerStart.y);
    applyPan();
  }
  function onPanUp() {
    panning = false;
    svgRef.classList.remove('is-panning');
    window.removeEventListener('pointermove', onPanMove);
    window.removeEventListener('pointerup', onPanUp);
  }

  function onPointerDown(e: PointerEvent, n: GraphNode) {
    e.preventDefault();
    (e.currentTarget as SVGGElement).focus();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    dragNode = n;
    dragStart = { x: e.clientX, y: e.clientY };
    dragMoved = false;
    const p = toWorld(e);
    n.fx = p.x;
    n.fy = p.y;
    focus(n);
    // A gentle nudge so neighbours ease aside without throwing the whole
    // (already settled) layout back into motion.
    sim?.reheat(0.25);
    startLoop();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }
  function onMove(e: PointerEvent) {
    if (!dragNode) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (dx * dx + dy * dy > CLICK_SLOP * CLICK_SLOP) dragMoved = true;
    const p = toWorld(e);
    dragNode.fx = p.x;
    dragNode.fy = p.y;
    sim?.reheat(0.2);
    startLoop();
  }
  function suppressNextClick() {
    suppressClick = true;
    window.setTimeout(() => {
      suppressClick = false;
    }, 0);
  }
  function onUp() {
    // Leave the node pinned where it was dropped (fx/fy retained) so users can
    // arrange nodes freely and they stay put.
    const clicked = dragNode && !dragMoved;
    const name = dragNode?.name;
    dragNode = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    if (name) suppressNextClick();
    if (clicked && name) searchPublications(name);
  }

  function onNodeKeyDown(e: KeyboardEvent, n: GraphNode) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    focus(n);
    searchPublications(n.name);
  }

  function onNodeClick(e: MouseEvent, n: GraphNode) {
    e.stopPropagation();
    if (suppressClick) return;
    searchPublications(n.name);
  }

  /* ---- hover/selection focus: spotlight a node and its neighbourhood ---- */
  function focus(n: GraphNode | null) {
    setActive(n);
    if (!sim) return;
    if (!n) {
      svgRef.classList.remove('is-focused');
      for (const x of sim.nodes as GraphNode[]) x.el?.classList.remove('hot', 'dim');
      for (const l of sim.links as GraphLink[]) l.el?.classList.remove('hot', 'dim');
      return;
    }
    svgRef.classList.add('is-focused');
    for (const x of sim.nodes as GraphNode[]) {
      const on = x.id === n.id || n.neighbors.has(x.id);
      x.el?.classList.toggle('hot', on);
      x.el?.classList.toggle('dim', !on);
    }
    for (const l of sim.links as GraphLink[]) {
      const on = l.source.id === n.id || l.target.id === n.id;
      l.el?.classList.toggle('hot', on);
      l.el?.classList.toggle('dim', !on);
    }
  }

  const thresholds = () => [
    { v: 1, label: t().network.thAll },
    { v: 2, label: t().network.th2 },
    { v: 3, label: t().network.th3 },
  ];

  return (
    <section id="network" class="section netsec">
      <div class="container">
        <div class="section-head" ref={reveal}>
          <span class="eyebrow">{t().network.eyebrow}</span>
          <h2>{t().network.heading}</h2>
        </div>

        <div class="net__controls" ref={reveal}>
          <div class="net__threshold" role="group" aria-label={t().network.filterLabel}>
            <span class="net__threshold-label">{t().network.filterLabel}</span>
            <For each={thresholds()}>
              {(th) => (
                <button
                  classList={{ active: minPapers() === th.v }}
                  onClick={() => setMinPapers(th.v)}
                  aria-pressed={minPapers() === th.v}
                >
                  {th.label}
                </button>
              )}
            </For>
          </div>
          <p class="net__stats">
            {t().network.stats(graph().nodes.length, graph().links.length)}
          </p>
        </div>

        <div class="net__stage" ref={reveal}>
          <svg
            ref={svgRef}
            class="net__svg"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={t().network.heading}
            onPointerDown={onPanDown}
          >
            <g ref={viewRef}>
            <g class="net__links">
              <For each={graph().links}>
                {(l) => (
                  <line
                    class="net__link"
                    ref={(el) => (l.el = el)}
                    x1={l.source.x}
                    y1={l.source.y}
                    x2={l.target.x}
                    y2={l.target.y}
                    style={{ 'stroke-width': `${Math.min(4, 0.5 + l.w * 0.45)}px` }}
                  />
                )}
              </For>
            </g>
            <g class="net__nodes">
              <For each={graph().nodes}>
                {(n) => (
                  <g
                    class="net__node"
                    classList={{ 'has-label': n.showLabel }}
                    ref={(el) => (n.el = el)}
                    transform={`translate(${n.x} ${n.y})`}
                    role="button"
                    tabIndex={0}
                    onPointerDown={(e) => onPointerDown(e, n)}
                    onClick={(e) => onNodeClick(e, n)}
                    onKeyDown={(e) => onNodeKeyDown(e, n)}
                    onPointerEnter={() => !dragNode && !panning && focus(n)}
                    onPointerLeave={() => !dragNode && !panning && focus(null)}
                  >
                    <circle class="net__halo" r={n.r + 5} />
                    <circle class="net__dot" r={n.r} />
                    <text class="net__label" x={0} y={0}>
                      {n.name}
                    </text>
                  </g>
                )}
              </For>
            </g>
            </g>
          </svg>

          <div class="net__readout" classList={{ 'is-active': !!active() }}>
            <Readout node={active()} />
          </div>

          <ul class="net__legend" aria-hidden="true">
            <li><span class="net__legend-dot net__legend-dot--sm" /><span class="net__legend-dot net__legend-dot--lg" />{t().network.legendSize}</li>
            <li><span class="net__legend-line" />{t().network.legendLink}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Readout(props: { node: GraphNode | null }) {
  const n = () => props.node;
  return (
    <Show when={n()} fallback={<p class="net__hint">{t().network.hint}</p>}>
      {(node) => (
        <div class="net__card">
          <span class="net__card-dot" />
          <div class="net__card-body">
            <strong class="net__card-name">{node().name}</strong>
            <span class="net__card-meta">
              {t().network.cardMeta(node().papers, node().degree)}
            </span>
          </div>
        </div>
      )}
    </Show>
  );
}
