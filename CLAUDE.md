# CLAUDE.md

Guidance for working in this repo. The site is the **ZJU Interactive Data Group**
homepage — a single-page SolidJS app that showcases the group's publications.

## Stack & commands

- **SolidJS + Vite + TypeScript**, package manager **pnpm**.
- Dark theme only. Full **English / Simplified Chinese** i18n (English default).

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # tsc -b && vite build -> dist/
pnpm preview    # serve the production build
```

Verify changes in the browser before claiming done (the repo is configured for the
preview tooling). Run `pnpm build` / `npx tsc -b` to typecheck.

## Architecture

- `src/App.tsx` — composition; loads data with `createResource`.
- `src/data.ts` — JSON loaders + URL resolvers (`asset`, `paperUrl`, `isTVCG`, `doiUrl`).
- `src/i18n.ts` — `en`/`zh` copy bundle + `lang` signal + `t()` accessor. UI strings live
  here, **not** inline in components. Paper titles/authors/venues are data and stay
  in their original language.
- `src/types.ts` — `Publication`, `Slide`.
- `src/components/` — `Nav`, `LangToggle`, `Hero`, `About`, `Carousel`, `Publications`,
  `PublicationCard`, `Footer`. Each has a colocated `.css`.
- `public/source/` — content JSON + teaser images (served as static assets).

Content lives in `public/source/`. **Edit those files directly** — they are the
committed, served source of truth. (`scripts/copy-assets.py` was a one-time migration
from the legacy CRA site in `old/`, which is git-ignored; don't rely on re-running it,
it would overwrite hand edits.)

## Adding a publication  ← most common task

A publication is one object in **`public/source/publications.json`**. Steps:

### 1. Add the teaser image (committed)
Put a teaser at `public/source/projects/<id>/<id>.png` (or `.jpg`). These are small and
**are** committed to the repo. If omitted, the card shows a gradient placeholder.

Commit the full-resolution original — don't hand-shrink it. At build time the
`compressTeasers` Vite plugin (`scripts/vite-plugin-compress-teasers.ts`) downscales and
recompresses every teaser in the `dist/` output to 440px wide (2× the largest rendered
thumbnail) and re-encodes (mozjpeg q80 / palette PNG). The committed sources under
`public/` are left untouched; only the deployed copies shrink. This cut the shipped
teaser payload from ~33 MB to ~4 MB.

### 2. Add the paper PDF (hosted on Cloudflare R2, NOT committed)
PDFs are too large for the repo (`public/source/**/*.pdf` is git-ignored). Place the PDF
locally at `public/source/projects/<id>/<file>.pdf`, then upload it to R2:

```bash
npx wrangler login                 # once, OAuth (1Password Touch ID approval)
PAPERS_PUBLIC_BASE=https://pub-b17d7d2288df4942a00824c4394886f8.r2.dev \
  scripts/upload-papers.sh zjuidg-papers
```

The script is **resumable** (skips PDFs already on R2). The R2 object key mirrors the
local path minus `source/` — e.g. `source/projects/foo/foo.pdf` → key
`projects/foo/foo.pdf`. At build time `paperUrl()` rewrites the `paper` field to
`$VITE_PAPERS_BASE/projects/foo/foo.pdf`. **If you skip the upload, the "Paper" link
404s.**

### 3. Add the JSON entry
Append an object to `public/source/publications.json` (order doesn't matter — the list is
sorted by `year` descending at load):

```jsonc
{
  "id": "foo",                                  // unique, kebab/lowercase
  "title": "Full Paper Title",
  "authors": ["First Author", "Di Weng", "Yingcai Wu"],
  "venue": ["IEEE TVCG", "IEEE VIS 2026"],       // Venue[] → venue chips, filter, chart color
  "year": 2026,                                 // number → sort, year tag, year filter
  "abstract": "…",                              // optional → expandable "Abstract"
  "teaser": "source/projects/foo/foo.png",      // optional
  "paper": "source/projects/foo/foo.pdf",       // optional → resolved to R2
  "doi": "10.1109/TVCG.2026.123456",            // optional → "DOI" link (doi.org/…)
  "video": "https://youtu.be/…",                // optional
  "demo": "https://…",                          // optional
  "system": "https://…",                        // optional → "System" link
  "titleKey": ["Best Paper", "Honorable Mention"] // optional → gold award badges
}
```

Field behavior worth knowing:

- **`venue`** is a `Venue[]` (`src/types.ts`) — the enum values *are* the labels stored in
  JSON. List the archival journal/outlet (generic, e.g. `"IEEE TVCG"`, `"Computer Graphics
  Forum"`) **and/or** the conference (year-specific, e.g. `"IEEE VIS 2026"`, `"CHI 2026"`,
  `"PacificVis 2026 TVCG Journal Track"`). Each entry renders as a venue chip. Add a new
  `Venue` member when introducing a new venue/year. Prefer reusing existing members so
  filtering/coloring stays consistent.
- **TVCG is just a `venue` entry.** IEEE VIS and PacificVis-journal papers are archived in
  TVCG, so include `"IEEE TVCG"` in `venue` alongside the conference — `isTVCG()` is now a
  membership check, and the unit chart / venue filter group these under "IEEE TVCG"
  (`venueGroup()` in `src/venues.ts`, which also strips the year, e.g. "IEEE VIS 2026" →
  "IEEE VIS"). Conference-track (non-journal) papers omit `"IEEE TVCG"`.
- **`titleKey`** entries render as gold award badges and make the paper count toward the
  "Award papers" filter.
- **`doi`/`DOI`**: bare DOI (e.g. `10.1109/…`) is auto-prefixed with `https://doi.org/`;
  a full URL is used as-is.

### 4. Deploy
Push to `main` → the GitHub Action (`.github/workflows/deploy.yml`) builds and publishes
to GitHub Pages. The build needs `VITE_PAPERS_BASE` set (locally via `.env`; in CI via a
repo variable). No manual deploy step — pushing is the deploy.

### 5. Regenerate the paper map
The "Paper map" section (`src/components/PaperMap.tsx`) draws one dot per paper at a
**precomputed** 2D position — there is no API call at page load. A new paper won't appear
on the map until you re-run the precompute, which embeds each title+abstract with an
OpenAI embedding model and projects the vectors to 2D with UMAP:

```bash
node scripts/compute-paper-map.mjs    # reads OPENAI_API_KEY from .env
```

It writes `public/source/paper-map.json` (committed) and caches embeddings under
`scripts/.cache/` (git-ignored), so re-runs only embed new/changed papers. Commit the
updated `paper-map.json`.

## Adding a carousel highlight (optional)

Add an object to `public/source/slides.json`. Translate the sentence in `titleZh` but keep
system/paper names verbatim; leave `subtitle` (the paper title) untranslated:

```jsonc
{
  "title":   "Foo Bar presented BazSystem at ACM CHI 2026!",
  "titleZh": "Foo Bar 在 ACM CHI 2026 上汇报了 BazSystem！",
  "subtitle":"Full Paper Title",
  "imgSrc":  "source/slides/baz.jpg"           // committed image
}
```

Clicking a slide searches the publication list for `subtitle` (the paper title) and scrolls
to it — see `searchPublications()` in `src/components/Carousel.tsx`. Make `subtitle` match
the publication's `title` exactly so the search resolves to a single card.

## Deployment quick reference

- **Hosting:** GitHub Pages, served at the custom domain https://zjuidg.org (apex, no
  subpath). The domain is pinned by `public/CNAME` (→ `dist/CNAME` at build), so Vite's
  `base` stays `/`. Repo Settings → Pages → Source must be **"GitHub Actions"**.
- **DNS (apex `zjuidg.org`):** A records → `185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153`; optional `www` → CNAME `zjuidg.github.io`.
- **Paper PDFs:** Cloudflare R2 bucket `zjuidg-papers`, public origin
  `https://pub-b17d7d2288df4942a00824c4394886f8.r2.dev` (`VITE_PAPERS_BASE`). (R2 is still
  used for PDFs even though the site itself is on GitHub Pages.)
- **CI:** `.github/workflows/deploy.yml` builds and deploys on push to `main` using the
  built-in `GITHUB_TOKEN` (no Cloudflare secrets). Requires only the repo variable
  `VITE_PAPERS_BASE`.

## Conventions

- Don't reintroduce a team/members section (people data from the old site is outdated).
- New user-facing strings go through `t()` in `src/i18n.ts` with both `en` and `zh`.
- Keep copy plain and factual; avoid marketing/dramatic phrasing.
