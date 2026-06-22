import { For } from 'solid-js';
import { reveal } from '../reveal';
import { t } from '../i18n';
import './About.css';

const icons = [
  'M3 3v18h18 M7 15l3-4 3 3 4-6',
  'M4 19a8 8 0 0 1 8-8 M4 19h16 M12 11V3 M18 19a6 6 0 0 0-6-6',
  'M2 8l10-5 10 5-10 5z M2 8v8l10 5 10-5V8',
  'M12 2a5 5 0 0 1 5 5v2a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z M5 21a7 7 0 0 1 14 0',
];

export default function About() {
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

        <div class="about__grid">
          <For each={t().about.areas}>
            {(a, i) => (
              <article
                class="about__card"
                ref={reveal}
                style={{ 'transition-delay': `${i() * 80}ms` }}
              >
                <span class="about__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d={icons[i()]} />
                  </svg>
                </span>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
              </article>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
