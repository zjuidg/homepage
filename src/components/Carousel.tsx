import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import type { Slide } from '../types';
import { asset } from '../data';
import { reveal } from '../reveal';
import { searchPublications } from '../search';
import { lang, t } from '../i18n';
import './Carousel.css';

const caption = (s: Slide) => (lang() === 'zh' && s.titleZh ? s.titleZh : s.title);

const INTERVAL = 6000;

export default function Carousel(props: { slides: Slide[] }) {
  const [active, setActive] = createSignal(0);
  const [paused, setPaused] = createSignal(false);
  const count = () => props.slides.length;

  const go = (n: number) => setActive((n + count()) % count());
  const next = () => go(active() + 1);
  const prev = () => go(active() - 1);

  onMount(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || count() <= 1) return;
    const id = setInterval(() => {
      if (!paused()) setActive((a) => (a + 1) % count());
    }, INTERVAL);
    onCleanup(() => clearInterval(id));
  });

  return (
    <section id="highlights" class="section carousel-section">
      <div class="container">
        <div class="section-head" ref={reveal}>
          <span class="eyebrow">{t().highlights.eyebrow}</span>
          <h2>{t().highlights.heading}</h2>
          <p>{t().highlights.subtitle}</p>
        </div>

        <div
          class="carousel"
          ref={reveal}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div class="carousel__viewport">
            <div class="carousel__track" style={{ transform: `translateX(-${active() * 100}%)` }}>
              <For each={props.slides}>
                {(s) => (
                  <button
                    type="button"
                    class="carousel__slide"
                    aria-label={caption(s)}
                    onClick={() => searchPublications(s.subtitle || caption(s))}
                  >
                    <img src={asset(s.imgSrc)} alt="" loading="lazy" />
                    <div class="carousel__caption">
                      <p class="carousel__title">{caption(s)}</p>
                      <Show when={s.subtitle}>
                        <p class="carousel__subtitle">{s.subtitle}</p>
                      </Show>
                    </div>
                  </button>
                )}
              </For>
            </div>
          </div>

          <Show when={count() > 1}>
            <button class="carousel__arrow carousel__arrow--prev" onClick={prev} aria-label="Previous slide">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button class="carousel__arrow carousel__arrow--next" onClick={next} aria-label="Next slide">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
            </button>

            <div class="carousel__dots">
              <For each={props.slides}>
                {(_, i) => (
                  <button
                    class="carousel__dot"
                    classList={{ active: active() === i() }}
                    onClick={() => go(i())}
                    aria-label={`Go to slide ${i() + 1}`}
                  />
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </section>
  );
}
