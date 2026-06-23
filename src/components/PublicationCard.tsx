import { createSignal, Show, For } from 'solid-js';
import type { Publication } from '../types';
import { asset, doiUrl, paperUrl } from '../data';
import { t } from '../i18n';
import './PublicationCard.css';

const ICONS: Record<string, string> = {
  paper: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8',
  doi: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  video: 'M23 7l-7 5 7 5V7z M1 5h15v14H1z',
  demo: 'M5 3l14 9-14 9V3z',
};

function LinkBtn(props: { kind: keyof typeof ICONS; label: string; href: string }) {
  return (
    <a class="pcard__link" href={props.href} target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d={ICONS[props.kind]} />
      </svg>
      {props.label}
    </a>
  );
}

export default function PublicationCard(props: { pub: Publication; index: number }) {
  const [open, setOpen] = createSignal(false);
  const p = props.pub;
  const doi = doiUrl(p);

  return (
    <article class="pcard">
      <div class="pcard__thumb">
        <Show when={p.teaser} fallback={<div class="pcard__thumb-ph" />}>
          <img src={asset(p.teaser)} alt="" loading="lazy" />
        </Show>
      </div>

      <div class="pcard__main">
        <div class="pcard__meta">
          <For each={p.venue}>{(v) => <span class="pcard__venue">{v}</span>}</For>
          <span class="pcard__tag pcard__year">{p.year}</span>
          <Show when={p.titleKey?.length}>
            <For each={p.titleKey}>{(k) => <span class="pcard__award">★ {k}</span>}</For>
          </Show>
        </div>

        <h3 class="pcard__title">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open()}
            disabled={!p.abstract}
          >
            {p.title}
          </button>
        </h3>

        <p class="pcard__authors">{p.authors.join(', ')}</p>

        <Show when={open() && p.abstract}>
          <p class="pcard__abstract">{p.abstract}</p>
        </Show>

        <div class="pcard__links">
          <Show when={p.paper}><LinkBtn kind="paper" label={t().card.paper} href={paperUrl(p.paper)} /></Show>
          <Show when={doi}><LinkBtn kind="doi" label={t().card.doi} href={doi} /></Show>
          <Show when={p.video}><LinkBtn kind="video" label={t().card.video} href={p.video!} /></Show>
          <Show when={p.demo}><LinkBtn kind="demo" label={t().card.demo} href={p.demo!} /></Show>
          <Show when={p.system}><LinkBtn kind="demo" label={t().card.system} href={p.system!} /></Show>
          <Show when={p.abstract}>
            <button class="pcard__link pcard__abstract-toggle" onClick={() => setOpen((v) => !v)}>
              {open() ? t().card.hideAbstract : t().card.abstract}
            </button>
          </Show>
        </div>
      </div>
    </article>
  );
}
