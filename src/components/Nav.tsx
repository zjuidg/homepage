import { createSignal, For, onCleanup, onMount } from 'solid-js';
import LangToggle from './LangToggle';
import { t } from '../i18n';
import './Nav.css';

export default function Nav() {
  const [scrolled, setScrolled] = createSignal(false);
  const [open, setOpen] = createSignal(false);

  const links = () => [
    { href: '#about', label: t().nav.about },
    { href: '#highlights', label: t().nav.highlights },
    { href: '#map', label: t().nav.map },
    { href: '#publications', label: t().nav.publications },
    { href: '#network', label: t().nav.network },
    { href: '#contact', label: t().nav.contact },
  ];

  onMount(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    onCleanup(() => window.removeEventListener('scroll', onScroll));
  });

  return (
    <header class={`nav ${scrolled() ? 'nav--scrolled' : ''}`}>
      <div class="container nav__inner">
        <a href="#top" class="nav__brand" onClick={() => setOpen(false)}>
          <span class="nav__mark" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
          <span class="nav__name">
            IDG<span class="nav__name-dim"> · ZJU</span>
          </span>
        </a>

        <nav class={`nav__links ${open() ? 'is-open' : ''}`}>
          <For each={links()}>
            {(l) => <a href={l.href} onClick={() => setOpen(false)}>{l.label}</a>}
          </For>
        </nav>

        <LangToggle />

        <button
          class="nav__burger"
          aria-label="Toggle menu"
          aria-expanded={open()}
          onClick={() => setOpen((v) => !v)}
        >
          <span class={open() ? 'x' : ''}></span>
        </button>
      </div>
    </header>
  );
}
