import { createMemo, createResource, createSignal, createUniqueId, For, onCleanup, onMount, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import type { Publication, PublicationCategory } from '../types';
import { loadPaperMap, type MapCoordinate, type MapRegion } from '../data';
import { venueChipLabel } from '../venues';
import { searchPublications } from '../search';
import { reveal } from '../reveal';
import { lang, t } from '../i18n';
import './PaperMap.css';

// Bright macaron pastels, shared with scripts/preview-topic-map.py.
const COLORS: Record<PublicationCategory, string> = {
  'sports-analytics': '#ffd2ad',
  'visualization-design': '#dccbff',
  'urban-geospatial': '#bcebd5',
  'data-wrangling': '#bfe0ff',
  'social-behavior': '#ffc5cd',
  'model-mechanisms': '#bceee7',
  'industrial-analytics': '#e7edb3',
  'cultural-heritage': '#f7c8e5',
  'perception-interaction': '#cdd5ff',
  'time-series-analysis': '#cfebbb',
  'health-analytics': '#ffe0cf',
  'causal-analysis': '#ffedba',
  'graph-analytics': '#bce4f1',
  'research-evaluation': '#e1ebcc',
  'multimodal-analytics': '#f4dec5',
};
const ringPath = (ring: MapCoordinate[]) => `M${ring.map((p) => p.join(',')).join('L')}Z`;
const linePath = (edges: [MapCoordinate, MapCoordinate][]) => edges.map(([a, b]) => `M${a.join(',')}L${b.join(',')}`).join('');
interface MapNode { pub: Publication; x: number; y: number; cell: MapCoordinate[] }
type TooltipDetail = { kind: 'paper'; node: MapNode } | { kind: 'topic'; region: MapRegion };
interface TooltipPosition { x: number; y: number; below: boolean; viewportHeight: number; anchor: Element | null }

export default function PaperMap(props: { pubs: Publication[] }) {
  const [map] = createResource(async () => {
    try { return await loadPaperMap(); } catch { return null; }
  });
  const [active, setActive] = createSignal<MapNode | null>(null);
  const [hovered, setHovered] = createSignal<PublicationCategory | null>(null);
  const [selected, setSelected] = createSignal<PublicationCategory | null>(null);
  const [zoom, setZoom] = createSignal(1);
  const [pan, setPan] = createSignal({ x: 0, y: 0 });
  const [tooltip, setTooltip] = createSignal<(TooltipDetail & TooltipPosition) | null>(null);
  const tooltipId = createUniqueId();
  let svg: SVGSVGElement | undefined;
  let drag: { pointer: number; x: number; y: number; panX: number; panY: number; scaleX: number; scaleY: number } | undefined;
  let didDrag = false;
  const hideTooltip = () => setTooltip(null);
  const tooltipPosition = (x: number, y: number, anchor: Element | null): TooltipPosition => {
    const box = anchor?.getBoundingClientRect();
    if (box) { x = box.left + box.width / 2; y = box.top + box.height / 2; }
    const below = y < window.innerHeight / 2;
    const tipWidth = Math.min(320, window.innerWidth - 24);
    return {
      x: Math.max(12, Math.min(x + 14, window.innerWidth - tipWidth - 12)),
      y: box ? below ? box.bottom : box.top : y,
      below, viewportHeight: window.innerHeight, anchor,
    };
  };
  const showTooltip = (event: PointerEvent | FocusEvent, detail: TooltipDetail) => {
    if (!drag) setTooltip({ ...detail, ...tooltipPosition(
      event instanceof PointerEvent ? event.clientX : 0,
      event instanceof PointerEvent ? event.clientY : 0,
      event instanceof PointerEvent ? null : event.currentTarget as Element,
    ) });
  };
  const moveTooltip = (event: PointerEvent) => {
    if (tooltip() && !drag) setTooltip((current) => current && { ...current, ...tooltipPosition(event.clientX, event.clientY, null) });
  };
  const tooltipText = createMemo(() => {
    const detail = tooltip();
    if (!detail) return null;
    if (detail.kind === 'paper') {
      const pub = detail.node.pub;
      return { title: pub.title, meta: `${pub.authors[0]} · ${pub.year} · ${pub.venue.map(venueChipLabel).join(' · ')}` };
    }
    return { title: t().map.categories[detail.region.category], meta: t().map.topicStats(detail.region.count, detail.region.paperShare * 100) };
  });
  const describesPaper = (id: string) => { const tip = tooltip(); return tip?.kind === 'paper' && tip.node.pub.id === id ? tooltipId : undefined; };
  const describesTopic = (category: PublicationCategory) => { const tip = tooltip(); return tip?.kind === 'topic' && tip.region.category === category ? tooltipId : undefined; };
  onMount(() => {
    const dismiss = (event: KeyboardEvent) => { if (event.key === 'Escape') hideTooltip(); };
    const onScroll = () => {
      const current = tooltip();
      if (!current?.anchor) { hideTooltip(); return; }
      const box = current.anchor.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) hideTooltip();
      else setTooltip({ ...current, ...tooltipPosition(0, 0, current.anchor) });
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', hideTooltip);
    window.addEventListener('keydown', dismiss);
    onCleanup(() => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', hideTooltip);
      window.removeEventListener('keydown', dismiss);
    });
  });
  const bounds = createMemo(() => {
    const coast = map()?.coast;
    if (!coast?.length) return { x: 0, y: 0, width: 1100, height: 800 };
    const xs = coast.map((p) => p[0]), ys = coast.map((p) => p[1]);
    const x = Math.min(...xs) - 32, y = Math.min(...ys) - 32;
    return { x, y, width: Math.max(...xs) - x + 32, height: Math.max(...ys) - y + 32 };
  });
  const width = () => bounds().width;
  const height = () => bounds().height;
  const focus = () => active()?.pub.category ?? selected() ?? hovered();
  const nodes = createMemo(() => {
    const pubs = new Map(props.pubs.map((p) => [p.id, p]));
    return (map()?.papers ?? []).flatMap((p) => {
      const pub = pubs.get(p.id);
      return pub ? [{ pub, x: p.x, y: p.y, cell: p.cell }] : [];
    });
  });
  const regions = createMemo(() => [...(map()?.regions ?? [])].sort((a, b) => b.count - a.count));
  const focusedRegion = createMemo(() => regions().find((r) => r.category === focus()));
  const borders = createMemo(() => linePath(map()?.borders ?? []));
  const subdivisions = createMemo(() => linePath(map()?.subdivisions ?? []));
  const coast = createMemo(() => ringPath(map()?.coast ?? []));
  const selectTopic = (category: PublicationCategory) => {
    if (!didDrag) setSelected((current) => current === category ? null : category);
  };
  const openPaper = (node: MapNode) => { hideTooltip(); searchPublications(node.pub.title); };
  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); setSelected(null); setHovered(null); setActive(null); hideTooltip(); };
  const changeZoom = (factor: number) => {
    hideTooltip();
    const next = Math.min(4, Math.max(1, zoom() * factor));
    setZoom(next);
    if (next === 1) setPan({ x: 0, y: 0 });
  };
  const lines = (region: MapRegion) => {
    const label = region.labels[lang()];
    const title = t().map.categories[region.category];
    if (label.lines.length === 1) return [title];
    const parts = lang() === 'zh' ? Array.from(title) : title.split(' ');
    let offset = 0;
    return label.lines.map((line) => {
      const count = lang() === 'zh' ? Array.from(line).length : line.split(' ').length;
      const value = parts.slice(offset, offset + count).join(lang() === 'zh' ? '' : ' ');
      offset += count;
      return value;
    });
  };
  const beginDrag = (event: PointerEvent) => {
    if (event.button !== 0 || !svg) return;
    didDrag = false;
    if (zoom() === 1) return;
    const box = svg.getBoundingClientRect();
    const unitScale = Math.max(width() / box.width, height() / box.height) / zoom();
    drag = { pointer: event.pointerId, x: event.clientX, y: event.clientY, panX: pan().x, panY: pan().y, scaleX: unitScale, scaleY: unitScale };
  };
  const moveDrag = (event: PointerEvent) => {
    if (!drag || drag.pointer !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 4) {
      didDrag = true;
      svg?.setPointerCapture(event.pointerId);
      setActive(null);
      hideTooltip();
      const limitX = width() * (1 - 1 / zoom()) / 2;
      const limitY = height() * (1 - 1 / zoom()) / 2;
      setPan({
        x: Math.max(-limitX, Math.min(limitX, drag.panX - (event.clientX - drag.x) * drag.scaleX)),
        y: Math.max(-limitY, Math.min(limitY, drag.panY - (event.clientY - drag.y) * drag.scaleY)),
      });
    }
  };
  const endDrag = (event: PointerEvent) => {
    if (svg?.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    drag = undefined;
  };

  return (
    <div id="map" class="paper-map">
      <Show when={map()} fallback={<p class="map__unavailable">{map.loading ? t().loading : t().map.unavailable}</p>}>
        <div class="map__atlas" ref={reveal}>
          <div class="map__toolbar">
            <div class="map__summary"><strong>{t().map.stats(nodes().length, regions().length)}</strong></div>
            <div class="map__zoom">
              <button type="button" aria-label={t().map.zoomOut} disabled={zoom() <= 1} onClick={() => changeZoom(1 / 1.4)}>−</button>
              <button type="button" aria-label={t().map.resetView} onClick={reset}>{Math.round(zoom() * 100)}%</button>
              <button type="button" aria-label={t().map.zoomIn} disabled={zoom() >= 4} onClick={() => changeZoom(1.4)}>+</button>
            </div>
          </div>
          <div class="map__body">
            <div class="map__stage">
              <svg ref={svg} class="map__svg" classList={{ 'is-zoomed': zoom() > 1, 'is-focused': focus() !== null }} style={{ '--map-aspect': `${width()} / ${height()}` }}
                viewBox={`${bounds().x + (width() - width() / zoom()) / 2 + pan().x} ${bounds().y + (height() - height() / zoom()) / 2 + pan().y} ${width() / zoom()} ${height() / zoom()}`}
                role="group" aria-label={t().map.heading} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
                <desc>{t().map.intro} {t().map.hint}</desc>
                <g class="map__regions" aria-hidden="true">
                  <For each={map()!.regions}>{(region) => (
                    <path d={region.rings.map(ringPath).join('')} fill={COLORS[region.category]} class="map__region"
                      data-category={region.category} classList={{ dim: focus() !== null && focus() !== region.category }} />
                  )}</For>
                </g>
                <g class="map__paper-cells">
                  <For each={nodes()}>{(node) => (
                    <path class="map__paper-cell" classList={{ hot: active()?.pub.id === node.pub.id }}
                      data-paper-id={node.pub.id} d={ringPath(node.cell)} role="button" tabIndex={0}
                      aria-label={node.pub.title} aria-describedby={describesPaper(node.pub.id)}
                      onPointerEnter={(e) => { if (!drag) { setActive(node); showTooltip(e, { kind: 'paper', node }); } }} onPointerMove={moveTooltip}
                      onPointerLeave={() => { setActive(null); hideTooltip(); }}
                      onFocus={(e) => { setActive(node); showTooltip(e, { kind: 'paper', node }); }} onBlur={() => { setActive(null); hideTooltip(); }}
                      onClick={() => { if (!didDrag) openPaper(node); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPaper(node); } }} />
                  )}</For>
                </g>
                <path d={subdivisions()} class="map__subdivisions" />
                <path d={borders()} class="map__borders" />
                <path d={coast()} class="map__coast" />
                <Show when={focusedRegion()}>{(region) => <path d={region().rings.map(ringPath).join('')} class="map__selected-border" />}</Show>
                <g class="map__labels" aria-hidden="true">
                  <For each={map()!.regions}>{(region) => {
                    const label = () => region.labels[lang()];
                    const text = () => lines(region);
                    return <text class="map__label" classList={{ dim: focus() !== null && focus() !== region.category }}
                      x={label().x} y={label().y} font-size={String(label().size)} style={{ '--land': COLORS[region.category] }} text-anchor="middle">
                      <For each={text()}>{(line, i) => <tspan x={label().x} y={label().y + (i() - (text().length - 1) / 2) * label().size * 1.12 + label().size * .34}>{line}</tspan>}</For>
                    </text>;
                  }}</For>
                </g>
                <g class="map__nodes" aria-hidden="true">
                  <For each={nodes()}>{(node) => (
                    <g class="map__node" classList={{ dim: focus() !== null && focus() !== node.pub.category, hot: active()?.pub.id === node.pub.id }}
                      transform={`translate(${node.x} ${node.y})`}>
                      <circle class="map__dot" r={3.6} />
                    </g>
                  )}</For>
                </g>
              </svg>
            </div>
            <aside class="map__sidebar" aria-label={t().map.topics}>
              <div class="map__legend-head"><h3>{t().map.topics}</h3><button type="button" onClick={reset} disabled={selected() === null && zoom() === 1}>{t().map.allTopics}</button></div>
              <ul class="map__legend">
                <For each={regions()}>{(region) => (
                  <li><button type="button" class="map__legend-item" classList={{ active: selected() === region.category, dim: focus() !== null && focus() !== region.category }}
                    aria-pressed={selected() === region.category} aria-describedby={describesTopic(region.category)}
                    onPointerEnter={(e) => { setHovered(region.category); showTooltip(e, { kind: 'topic', region }); }} onPointerMove={moveTooltip}
                    onPointerLeave={() => { setHovered(null); hideTooltip(); }}
                    onFocus={(e) => { setHovered(region.category); showTooltip(e, { kind: 'topic', region }); }} onBlur={() => { setHovered(null); hideTooltip(); }} onClick={() => { didDrag = false; selectTopic(region.category); }}>
                    <span class="map__swatch" style={{ background: COLORS[region.category] }} /><span class="map__legend-name">{t().map.categories[region.category]}</span><span class="map__legend-count">{region.count}</span>
                  </button></li>
                )}</For>
              </ul>
            </aside>
          </div>
        </div>
        <Show when={tooltip()}>{(tip) => (
          <Portal>
            <div id={tooltipId} class="map__tooltip" role="tooltip" style={{
              left: `${tip().x}px`,
              top: tip().below ? `${tip().y + 14}px` : undefined,
              bottom: tip().below ? undefined : `${tip().viewportHeight - tip().y + 14}px`,
            }}>
              <strong>{tooltipText()?.title}</strong><span>{tooltipText()?.meta}</span>
            </div>
          </Portal>
        )}</Show>
      </Show>
    </div>
  );
}
