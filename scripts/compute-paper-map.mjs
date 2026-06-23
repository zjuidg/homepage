/**
 * Precompute the "paper map" layout.
 *
 *   1. embed each publication (title + abstract) with an OpenAI embedding model
 *   2. project the embeddings to 2D with UMAP
 *   3. write public/source/paper-map.json  ->  { id: [x, y], ... }, x/y in [-1, 1]
 *
 * The PaperMap component reads that JSON and draws one dot per paper — no API
 * key or model run at page-load time. Re-run this script when publications
 * change (it caches embeddings by content hash, so unchanged papers are free):
 *
 *   node scripts/compute-paper-map.mjs            # uses OPENAI_API_KEY from .env
 *
 * Tunables via env: EMBED_MODEL (default text-embedding-3-small),
 * UMAP_NEIGHBORS (default 15), UMAP_MIN_DIST (default 0.1).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UMAP } from 'umap-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBS = resolve(root, 'public/source/publications.json');
const OUT = resolve(root, 'public/source/paper-map.json');
const CACHE = resolve(root, 'scripts/.cache/paper-embeddings.json');

const MODEL = process.env.EMBED_MODEL || 'text-embedding-3-small';
// Smaller nNeighbors emphasises local structure and minDist packs each group
// tighter — together they make topical clusters more visually distinct.
const N_NEIGHBORS = Number(process.env.UMAP_NEIGHBORS || 8);
const MIN_DIST = Number(process.env.UMAP_MIN_DIST || 0.05);

/** Deterministic PRNG (mulberry32) so the layout is reproducible across runs. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cosine distance — the natural metric for embedding vectors. */
function cosineDistance(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return 1 - dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

/** Read OPENAI_API_KEY from the environment, falling back to the repo .env. */
function apiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  try {
    const env = readFileSync(resolve(root, '.env'), 'utf8');
    const m = env.match(/^OPENAI_API_KEY\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  } catch {
    /* no .env — fall through */
  }
  throw new Error('OPENAI_API_KEY not set (env or .env).');
}

/** The text we embed for each paper: title plus abstract when present. */
function paperText(p) {
  return [p.title, p.abstract].filter(Boolean).join('\n\n');
}

function loadCache() {
  try {
    return JSON.parse(readFileSync(CACHE, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  mkdirSync(dirname(CACHE), { recursive: true });
  writeFileSync(CACHE, JSON.stringify(cache));
}

/** Embed a batch of texts via the OpenAI embeddings REST API. */
async function embedBatch(key, inputs) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, input: inputs }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI embeddings ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const json = await res.json();
  // The API preserves input order in data[].index, but sort to be safe.
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

/** Center the 2D points and scale uniformly into [-1, 1], preserving shape. */
function normalize(points) {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  let max = 1e-9;
  for (const [x, y] of points) max = Math.max(max, Math.abs(x - cx), Math.abs(y - cy));
  return points.map(([x, y]) => [(x - cx) / max, (y - cy) / max]);
}

async function main() {
  const pubs = JSON.parse(readFileSync(PUBS, 'utf8'));
  const key = apiKey();
  const cache = loadCache();

  // Resolve each paper's embedding, hitting the API only for new/changed text.
  const texts = pubs.map(paperText);
  const hashes = texts.map((t) => createHash('sha1').update(`${MODEL}\0${t}`).digest('hex'));
  const missing = [];
  pubs.forEach((p, i) => {
    if (!cache[hashes[i]]) missing.push(i);
  });

  console.log(`${pubs.length} papers · ${missing.length} to embed (${pubs.length - missing.length} cached) · model ${MODEL}`);

  const BATCH = 100;
  for (let i = 0; i < missing.length; i += BATCH) {
    const idxs = missing.slice(i, i + BATCH);
    const vectors = await embedBatch(key, idxs.map((j) => texts[j]));
    idxs.forEach((j, k) => (cache[hashes[j]] = vectors[k]));
    saveCache(cache);
    console.log(`  embedded ${Math.min(i + BATCH, missing.length)}/${missing.length}`);
  }

  const data = pubs.map((_, i) => cache[hashes[i]]);

  // Project to 2D with UMAP. nNeighbors must stay below the sample count; cosine
  // distance suits embedding vectors and tends to surface topical clusters.
  const nNeighbors = Math.max(2, Math.min(N_NEIGHBORS, pubs.length - 1));
  console.log(`UMAP: ${pubs.length} points, ${data[0].length}D -> 2D, nNeighbors ${nNeighbors}, minDist ${MIN_DIST}`);
  const umap = new UMAP({
    nComponents: 2,
    nNeighbors,
    minDist: MIN_DIST,
    spread: 1,
    distanceFn: cosineDistance,
    random: mulberry32(42),
  });
  const points = normalize(umap.fit(data));

  const out = {};
  pubs.forEach((p, i) => {
    out[p.id] = [Number(points[i][0].toFixed(4)), Number(points[i][1].toFixed(4))];
  });

  writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n');
  console.log(`wrote ${OUT} (${pubs.length} points)`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
