import { onCleanup, onMount } from 'solid-js';
import { t } from '../i18n';
import './Hero.css';

interface Props {
  pubCount: number;
  venueCount: number;
}

export default function Hero(props: Props) {
  let canvas: HTMLCanvasElement | undefined;

  onMount(() => {
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    type P = { x: number; y: number; vx: number; vy: number };
    let pts: P[] = [];

    const resize = () => {
      const r = canvas!.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas!.width = w * dpr; canvas!.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.round((w * h) / 16000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      // links
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const d2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
          if (d2 < 130 * 130) {
            const o = (1 - Math.sqrt(d2) / 130) * 0.5;
            ctx.strokeStyle = `rgba(120,150,255,${o})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      // nodes
      for (const p of pts) {
        ctx.fillStyle = 'rgba(160,190,255,0.85)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    onCleanup(() => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    });
  });

  return (
    <section id="top" class="hero">
      <canvas ref={canvas} class="hero__net" aria-hidden="true"></canvas>
      <div class="hero__orb hero__orb--1" aria-hidden="true"></div>
      <div class="hero__orb hero__orb--2" aria-hidden="true"></div>

      <div class="container hero__inner">
        <p class="eyebrow hero__eyebrow">{t().hero.eyebrow}</p>

        <h1 class="hero__title">
          <span>{t().hero.title1}</span>
          <span class="gradient-text">{t().hero.title2}</span>
        </h1>

        <p class="hero__lead">{t().hero.lead}</p>

        <div class="hero__actions">
          <a class="btn btn--primary" href="#publications">
            {t().hero.explore}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
          <a class="btn btn--ghost" href="#about">{t().hero.aboutCta}</a>
        </div>

        <dl class="hero__stats">
          <div>
            <dt>2015</dt>
            <dd>{t().hero.stats.founded}</dd>
          </div>
          <div>
            <dt>{props.pubCount}+</dt>
            <dd>{t().hero.stats.publications}</dd>
          </div>
          <div>
            <dt>{props.venueCount}</dt>
            <dd>{t().hero.stats.venues}</dd>
          </div>
        </dl>
      </div>

      <a href="#about" class="hero__scroll" aria-label="Scroll down">
        <span></span>
      </a>
    </section>
  );
}
