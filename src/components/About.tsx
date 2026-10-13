import { Show } from 'solid-js';
import type { Publication } from '../types';
import PaperMap from './PaperMap';
import { reveal } from '../reveal';
import { t } from '../i18n';

export default function About(props: { pubs?: Publication[] }) {
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
        <Show when={props.pubs} fallback={<p class="map__unavailable">{t().loading}</p>}>
          {(pubs) => <PaperMap pubs={pubs()} />}
        </Show>
      </div>
    </section>
  );
}
