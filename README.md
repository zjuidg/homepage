# ZJU Interactive Data Group — Homepage

A modern, dark redesign of the [Interactive Data Group](https://zjuidg.org) homepage,
built with **SolidJS + Vite + TypeScript**. The site is a single-page experience that
showcases the group's research publications, with full **English / Simplified Chinese**
support.

## Sections

- **Hero** — animated constellation network and live stats (founded, publication count, venues).
- **About** — research areas of the lab.
- **Highlights** — auto-playing photo carousel of recent talks, awards, and papers (`slides.json`).
- **Publications** — searchable / filterable, paginated list of all papers (`publications.json`),
  with an award-paper filter, abstracts, teasers, and links to paper PDF, DOI, video, and demos.
- **Contact / Footer** — group contact details.

> Faculty and student listings from the old site were intentionally dropped (outdated).

## Internationalization

UI copy lives in [`src/i18n.ts`](src/i18n.ts) (`en` + `zh`). The language switcher is in the
nav; the choice is persisted in `localStorage`. **English is the default.** Paper titles,
authors, and venues stay in their original language; carousel captions are translated while
system/paper names are kept verbatim.

## Content & data

Content is driven by JSON + image assets served from `public/source/`:

| File | Purpose |
| --- | --- |
| `source/publications.json` | All publications (sorted newest-first at load) |
| `source/slides.json` | Carousel highlight slides (`titleZh` for Chinese captions) |
| `source/featuredProj.json` | Featured publication ids |
| `source/projects/<id>/…` | Teaser images |

Teaser/JSON paths inside the data are relative and resolved against the app base at runtime
in [`src/data.ts`](src/data.ts).

### Paper PDFs (Cloudflare R2)

Paper PDFs are **not** bundled in the repo (≈900MB) — they are hosted on a public
**Cloudflare R2** bucket (`zjuidg-papers`) and resolved at build time via the
`VITE_PAPERS_BASE` env var. Object keys mirror `public/source/` minus the leading
`source/` (e.g. `projects/trajgram/trajgram.pdf`). To (re)upload PDFs:

```bash
# 1) populate public/source from the legacy site (incl. PDFs)
python3 scripts/copy-assets.py
# 2) authenticate wrangler (OAuth) and upload PDFs to R2 (resumable)
npx wrangler login
PAPERS_PUBLIC_BASE=https://pub-XXXX.r2.dev scripts/upload-papers.sh zjuidg-papers
```

`scripts/copy-assets.py` copies only the assets referenced by `publications.json`
(teasers + papers) plus the JSON files — it skips outdated member photos and the intro video.
The legacy CRA build in [`old/`](old) is git-ignored.

## Development

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # production build -> dist/
pnpm preview    # preview the production build
```

For local builds, copy `.env.example` to `.env` and set `VITE_PAPERS_BASE` to the R2 origin
(without it, `Paper` links fall back to local files if present).

## Deployment (GitHub Pages)

The site deploys to **GitHub Pages** at the custom domain **https://zjuidg.org** (apex, no
subpath). A GitHub Action ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))
builds and publishes on every push to `main` using the built-in `GITHUB_TOKEN` — no cloud
provider secrets required.

One-time setup:

1. **Settings → Pages → Source:** select **"GitHub Actions"**.
2. **Settings → Pages → Custom domain:** `zjuidg.org` (also pinned by
   [`public/CNAME`](public/CNAME), which ships to `dist/CNAME` at build, so Vite's `base`
   stays `/`). Enable *Enforce HTTPS* once DNS resolves.
3. **DNS** for the apex `zjuidg.org`: `A` records →
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   (optional `www` → `CNAME` `zjuidg.github.io`).
4. **Settings → Secrets and variables → Actions:** add the repo variable below.

| Kind | Name | Value |
| --- | --- | --- |
| Variable | `VITE_PAPERS_BASE` | the public R2 origin, e.g. `https://pub-XXXX.r2.dev` |

The site is hosted on GitHub Pages, but paper PDFs are still served from Cloudflare R2 (see
above) — the two are independent.

## Project structure

```
src/
  App.tsx              # composition + data loading (createResource)
  data.ts              # JSON loaders + asset/paper URL resolvers
  i18n.ts              # en/zh copy bundle + language signal
  types.ts             # Publication / Slide types
  reveal.ts            # IntersectionObserver scroll-reveal helper
  index.css            # theme tokens, backdrop, shared utilities
  components/          # Nav, LangToggle, Hero, About, Carousel, Publications, PublicationCard, Footer
public/source/         # content JSON + teaser images
scripts/               # copy-assets.py, upload-papers.sh
```

## Theming

Design tokens (colors, gradients, radii) live as CSS custom properties in
[`src/index.css`](src/index.css). The palette is a cool cyan→blue→violet "data spectrum"
on a near-black background. Respects `prefers-reduced-motion`.
