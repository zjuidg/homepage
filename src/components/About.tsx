import { For } from 'solid-js';
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
                      >
                        {name}
                      </button>
                    )}
                  </For>
                </div>
              </article>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
