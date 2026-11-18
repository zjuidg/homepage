import { createResource, ErrorBoundary, For, Show, Suspense } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { asset, loadHighlights } from '../data';
import { formatDate, lang, t } from '../i18n';
import { searchPublications } from '../search';
import './Highlights.css';

const RECENT_COUNT = 5;

export default function Highlights(props: { archive?: boolean }) {
  const [highlights] = createResource(loadHighlights);
  const entries = () => props.archive ? highlights() : highlights()?.slice(0, RECENT_COUNT);

  const paperHref = (title: string) =>
    `${asset('/')}?${new URLSearchParams({ paper: title.trim() })}#publications`;

  const openPaper = (event: MouseEvent, title: string) => {
    if (props.archive || event.defaultPrevented || event.button !== 0 ||
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    searchPublications(title.trim());
  };

  return (
    <section
      id={props.archive ? 'news' : 'highlights'}
      class="section highlights"
      classList={{ 'highlights--archive': props.archive }}
    >
      <div class="container">
        <header class="highlights__header">
          <Dynamic component={props.archive ? 'h1' : 'h2'}>
            {props.archive ? t().highlights.archiveHeading : t().highlights.heading}
          </Dynamic>
          <Show when={props.archive} fallback={
            <a class="highlights__link" href={asset('news/')}>
              {t().highlights.allNews} <span aria-hidden="true">→</span>
            </a>
          }>
            <a class="highlights__link" href={asset('/#highlights')}>
              <span aria-hidden="true">←</span> {t().highlights.backToHighlights}
            </a>
          </Show>
        </header>

        <ErrorBoundary fallback={<p class="highlights__status">{t().highlights.unavailable}</p>}>
          <Suspense fallback={<p class="highlights__status" role="status">{t().highlights.loading}</p>}>
            <Show when={entries()?.length} fallback={<p class="highlights__status">{t().highlights.empty}</p>}>
              <ol class="timeline" role="list">
                <For each={entries()}>
                  {(entry) => (
                    <li class="timeline__entry">
                      <div class="timeline__meta">
                        <time datetime={entry.date}>{formatDate(entry.date, entry.endDate)}</time>
                        <span class="timeline__event">
                          {lang() === 'zh' ? entry.eventZh ?? entry.event : entry.event}
                        </span>
                      </div>
                      <p class="timeline__body">
                        <For each={entry.body}>
                          {(part) => 'paperTitle' in part ? (
                            <a
                              class="timeline__paper"
                              href={paperHref(part.paperTitle)}
                              title={part.paperTitle}
                              onClick={(e) => openPaper(e, part.paperTitle)}
                            >
                              {part.label}
                            </a>
                          ) : (
                            <>{lang() === 'zh' ? part.textZh ?? part.text : part.text}</>
                          )}
                        </For>
                      </p>
                    </li>
                  )}
                </For>
              </ol>
            </Show>
          </Suspense>
        </ErrorBoundary>
      </div>
    </section>
  );
}
