/* @refresh reload */
import { createEffect } from 'solid-js';
import { render } from 'solid-js/web';
import Footer from './components/Footer';
import Highlights from './components/Highlights';
import Nav from './components/Nav';
import { t } from './i18n';
import './index.css';

function News() {
  createEffect(() => {
    document.title = `${t().highlights.archiveHeading} · ${t().footer.brand}`;
  });

  return (
    <>
      <Nav archive />
      <main id="top">
        <Highlights archive />
      </main>
      <Footer archive />
    </>
  );
}

render(() => <News />, document.getElementById('root')!);
