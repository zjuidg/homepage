import { createResource, Show, Suspense } from 'solid-js';
import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Highlights from './components/Highlights';
import CoauthorNetwork from './components/CoauthorNetwork';
import Publications from './components/Publications';
import Footer from './components/Footer';
import { loadPublications } from './data';
import { t } from './i18n';
import './App.css';

export default function App() {
  const [pubs] = createResource(loadPublications);

  return (
    <>
      <Nav />
      <main>
        <Hero pubs={pubs()} />
        <About pubs={pubs()} />
        <Highlights />

        <Suspense fallback={<Loader />}>
          <Show when={pubs()}>
            <Publications pubs={pubs()!} />
            <CoauthorNetwork pubs={pubs()!} />
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
