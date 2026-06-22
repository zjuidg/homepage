import { createResource, Show, Suspense } from 'solid-js';
import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Carousel from './components/Carousel';
import Publications from './components/Publications';
import Footer from './components/Footer';
import { loadPublications, loadSlides } from './data';
import { t } from './i18n';
import './App.css';

export default function App() {
  const [pubs] = createResource(loadPublications);
  const [slides] = createResource(loadSlides);

  const venueCount = () => new Set((pubs() ?? []).map((p) => p.source)).size;

  return (
    <>
      <Nav />
      <main>
        <Hero pubCount={pubs()?.length ?? 120} venueCount={venueCount() || 12} />
        <About />

        <Suspense fallback={<Loader />}>
          <Show when={slides()?.length}>
            <Carousel slides={slides()!} />
          </Show>
          <Show when={pubs()}>
            <Publications pubs={pubs()!} />
          </Show>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

function Loader() {
  return (
    <div class="app-loader">
      <div class="app-loader__bars"><span></span><span></span><span></span><span></span></div>
      <p>{t().loading}</p>
    </div>
  );
}
