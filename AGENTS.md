# AGENTS.md

Guidance for working in this repo. The site is the **ZJU Interactive Data Group**
homepage — a single-page SolidJS app that showcases the group's publications.

## Stack & commands

- **SolidJS + Vite + TypeScript**, package manager **pnpm**.
- Dark and light themes (dark default), with a saved choice in the navigation.
  Full **English / Simplified Chinese** i18n (English default).

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
- `src/theme.ts`: theme signal and switcher state. `index.html` restores the saved
  theme before the first paint. Theme colors live in `src/index.css`.
- `src/types.ts` — `Publication`, `Slide`.
- `src/components/`: `Nav`, `LangToggle`, `Hero`, `About`, `PaperMap`, `Carousel`,
  `Publications`, `PublicationCard`, `Footer`. Component styles live in colocated
  `.css` files. `About` embeds `PaperMap` below the group introduction.
- `public/source/` — content JSON + teaser images (served as static assets).

Content lives in `public/source/`. **Edit those files directly** — they are the
committed, served source of truth. (`scripts/copy-assets.py` was a one-time migration
from the legacy CRA site in `old/`, which is git-ignored; don't rely on re-running it,
it would overwrite hand edits.)

## Adding a publication  ← most common task

A publication is one object in **`public/source/publications.json`**. Steps:

Complete the category record, map regeneration, and validation before committing
an addition. The map is embedded in **About Us** and reads
`public/source/paper-topic-map.json`; updating publications alone does not add a
paper to that map. Edit the served sources directly, without rerunning the legacy
asset migration. Preserve existing IDs and entry order when adding a paper.

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
  "category": "visualization-design",            // exactly one primary research category
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

- **`category`** is one required `PublicationCategory` value (`src/types.ts`), stored
  as a scalar string. Assign it from the paper's main research problem and contribution,
  following [the category codebook](docs/publication-categories.md). Do not classify by
  venue or by the mere use of AI or immersive tools. Keep one primary category even
  when a paper crosses topics, and update the coding record when adding a publication.
  Human-AI collaboration spans topics and is not a separate primary category.
  Classify interaction processes under perception and interaction, and analytical
  artifact verification or provenance under data wrangling.
  Classify surveys and datasets by their research topic. Reserve `research-evaluation`
  for research rigor, evaluation methods, and evaluation tools. Category display names
  use 4-6 Chinese characters and 2-3 English words. `model-mechanisms` includes
  internal model analysis, knowledge editing, model security, and language
  reasoning. Forecasting, cross-modal translation, and annotation tools belong
  to time series, multimodal analysis, and data wrangling respectively.
  Table construction and table layout editing, including `TableIllustrator`,
  belong to data wrangling. Geographic visualization authoring, including
  `geoanimation`, stays in visualization design; cross-topic semantic links
  determine its proximity to geographic analysis papers.
- **Classification record:** read the title and abstract, then add one row to
  `docs/publication-categories.md` with the ID, title, category, and a short reason
  supported by a quoted phrase. If an abstract is unavailable, use the paper or
  an author/publisher source and record that source. Update the scope count and
  category counts in the codebook. Reuse an existing category where it fits.
  A new category also needs its type in `src/types.ts`, both translations in
  `src/i18n.ts`, and colors in `src/components/PaperMap.tsx` and
  `scripts/preview-topic-map.py`, before regenerating the map.
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
- **Archival journals determine the venue count.** `venueGroup()` prefers
  `"IEEE TVCG"` and `"Journal of Visualization"` when either is present, so a paper may
  retain a conference chip (for example, `"ChinaVis 2025"`) while counting under its
  journal. The venue filter still finds the paper under both venue series.
- **The hero chart only colors CCF-A venues.** `src/ccf-venues.ts` defines its groups
  and fixed colors. Other publications stay visible in gray, including short papers,
  demos, workshops, and art-gallery tracks. Update the mapping when adding a new
  CCF-A venue. The paper map uses research categories. Node repulsion makes topics
  with more papers generally occupy more space, without exact area targets.
- **`titleKey`** entries render as gold award badges and make the paper count toward the
  "Award papers" filter.
- **`doi`/`DOI`**: bare DOI (e.g. `10.1109/…`) is auto-prefixed with `https://doi.org/`;
  a full URL is used as-is.

### 4. Regenerate the paper map
The unit chart and co-author network update automatically from `publications.json`, but
the paper map uses the committed, precomputed layout in
`public/source/paper-topic-map.json`. Regenerate it whenever publications are added,
removed, reordered, or their IDs, titles, abstracts, categories, or category labels
change. Author, venue, year, link, and teaser edits alone do not change the layout.

Install the Node dependencies with `pnpm install`. Use Python 3.10 or newer with
NumPy and Pillow. For a local Python environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install numpy pillow
```

The label-measurement helper currently looks for macOS Arial and Heiti fonts.
On other systems, configure installed Latin and CJK font paths in
`scripts/preview-topic-map.py` (`font_path`) before generating labels.

Run the following from the repository root:

```bash
node scripts/compute-paper-map.mjs --embeddings-only
python3 -B scripts/compute-topic-map.py
node scripts/validate-topic-map.mjs
```

The script reads `OPENAI_API_KEY` from the environment or `.env`, caches embeddings by
content hash in `scripts/.cache/paper-embeddings.json`, and only requests embeddings for
new or changed papers. The Python step requires NumPy and Pillow. It computes a
semantic force layout with soft topic constraints and refines within-topic neighbors
with UMAP through the existing Node dependency. Global cosine-neighbor links orient
those groups and remain active as cross-topic springs in the final node relaxation.
UMAP self-distances must be exactly zero. The generator records projection settings
and cross-topic neighbor recall; `--projection tsne` is retained for comparisons. It merges
ordinary paper Voronoi cells after resolving marker collisions. There is no
area fitting, cell area cap, or polygon deformation. Marker centers stay at
least 9 SVG units apart. Semantic neighbor recall before and after node
relaxation is recorded in the output metrics.
Category-only changes reuse the existing title/abstract embeddings. A fresh
checkout has no embedding cache, so it needs `OPENAI_API_KEY` to create one.
Keep the embedding model at `text-embedding-3-small`, matching the topic generator.
If embeddings are missing or validation fails, complete regeneration before
publishing the new paper. Do not substitute the previous map or edit coordinates
and polygons by hand.

Commit the updated `public/source/paper-topic-map.json` with the publication and
its coding record. Keep `.env`, `.venv`, `scripts/.cache`, PDFs, and temporary
previews out of Git. The page reads these
precomputed polygons without running a model or layout in the browser.

`public/source/paper-map.json` and the UMAP mode of `compute-paper-map.mjs` are
retained as the previous layout. They are no longer used by the homepage map.
See [the map implementation notes](docs/paper-topic-map.md) for regeneration,
geometry checks, and the CausalMap style reference.

### 5. Validate and review

Run `node scripts/validate-topic-map.mjs` and `pnpm build`. The validator checks the
publication hash, one cell per paper, category counts, marker spacing, containment,
and the Voronoi partition. The generator also checks region connectivity. TypeScript
alone does not validate the contents of the publication JSON.

Open `pnpm dev` and check English and Chinese:

- Find the new paper in the publication list and verify the teaser, venue, and PDF link.
- Find its cell in the About Us map, check the category and legend count, and check
  that the tooltip and cell click identify the same paper.
- Check the whole map for readable labels and sensible neighbors. Cross-topic
  proximity is allowed; do not change the primary category just to move a point.

### 6. Commit and deploy

Review and commit the publication JSON, teaser, category codebook, generated
`paper-topic-map.json`, and any related type or translation changes together.
Include carousel assets and `slides.json` only when adding a highlight.

When publishing is requested, push to `main`. The current
`.github/workflows/deploy.yml` builds and publishes to **GitHub Pages** at
https://zjuidg.org. It serves the committed map without regenerating embeddings
or polygons. The build needs `VITE_PAPERS_BASE` set locally in `.env` and as a
repository variable in CI. A request to commit alone does not include pushing.

## Adding a carousel highlight (optional)

Add an object to `public/source/slides.json`. Translate the sentence in `titleZh` but keep
system/paper names verbatim; leave `subtitle` (the paper title) untranslated:

```jsonc
{
  "title":   "Foo Bar presented BazSystem at ACM CHI 2026!",
  "titleZh": "Foo Bar 在 ACM CHI 2026 上汇报了 BazSystem！",
  "subtitle":"Full Paper Title",
  "imgSrc":  "source/slides/baz.jpg",          // committed image
  "link":    "/publications/foo"
}
```

Clicking a slide searches for its `subtitle` and scrolls to the publication list.
Keep `subtitle` identical to the paper's title.

## Deployment quick reference

- **Hosting:** GitHub Pages at https://zjuidg.org, as configured in
  `.github/workflows/deploy.yml`; `public/CNAME` supplies the custom domain.
- **Paper PDFs:** Cloudflare R2 bucket `zjuidg-papers`, public origin
  `https://pub-b17d7d2288df4942a00824c4394886f8.r2.dev` (`VITE_PAPERS_BASE`).
- **CI:** `.github/workflows/deploy.yml` deploys on push to `main` using
  `GITHUB_TOKEN` and the repository variable `VITE_PAPERS_BASE`. R2 upload
  credentials are separate from the site's deployment.

## Conventions

- Don't reintroduce a team/members section (people data from the old site is outdated).
- New user-facing strings go through `t()` in `src/i18n.ts` with both `en` and `zh`.
- Keep copy plain and factual; avoid marketing/dramatic phrasing.
