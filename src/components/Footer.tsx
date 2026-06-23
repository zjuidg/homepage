import { reveal } from '../reveal';
import { t } from '../i18n';
import './Footer.css';

export default function Footer() {
  return (
    <footer id="contact" class="footer">
      <div class="container">
        <div class="footer__cta" ref={reveal}>
          <span class="eyebrow">{t().footer.eyebrow}</span>
          <h2>
            {t().footer.headingPre}
            <span class="gradient-text">{t().footer.headingEm}</span>
            {t().footer.headingPost}
          </h2>
          <p>{t().footer.body}</p>
          <a class="btn btn--primary" href="mailto:wlxuan@zju.edu.cn">
            wlxuan@zju.edu.cn
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </a>
        </div>

        <div class="footer__grid">
          <div class="footer__brand">
            <span class="footer__mark" aria-hidden="true"><span></span><span></span><span></span></span>
            <div class="footer__brand-text">
              <strong>{t().footer.brand}</strong>
              <span>{t().footer.lab}</span>
              <address class="footer__addr">
                {t().footer.address1}<br />
                {t().footer.address2}
              </address>
            </div>
          </div>

          <nav class="footer__links" aria-label="Footer">
            <a href="#about">{t().footer.links.about}</a>
            <a href="#highlights">{t().footer.links.highlights}</a>
            <a href="#publications">{t().footer.links.publications}</a>
          </nav>
        </div>

        <div class="footer__bottom">
          <span>{t().footer.rights(new Date().getFullYear())}</span>
          <a href="#top">{t().footer.backToTop}</a>
        </div>
      </div>
    </footer>
  );
}
