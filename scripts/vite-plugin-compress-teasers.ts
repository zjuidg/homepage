import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import type { Plugin } from 'vite';
import sharp from 'sharp';

/**
 * Static images under `public/source/**` are copied to the build verbatim by
 * Vite (anything under `public/` bypasses the asset pipeline). The committed
 * sources are full-resolution, but the site only ever renders downscaled copies.
 * This plugin downscales + recompresses the copies in `dist/`, sized per use:
 *
 *   - `source/projects/**` teasers render as 180px (desktop) / 220px (mobile)
 *     thumbnails on publication cards.
 *   - `source/slides/**` render full-width in the highlights carousel, which is
 *     capped by the page container (--maxw 1180px → ~1132px content width).
 *
 * Each target is downscaled to ~2x its largest rendered width, so the deployed
 * images stay crisp on HiDPI screens without shipping multi-megabyte originals.
 * Only the build output is rewritten — the committed sources in `public/` are
 * left untouched.
 */

// { subdir under dist/source, max width = 2x the largest rendered width }
const TARGETS = [
  { dir: 'projects', maxWidth: 440 }, // 2x the 220px mobile thumbnail
  { dir: 'slides', maxWidth: 2280 }, // 2x the ~1132px full-width carousel slide
];

const JPEG_QUALITY = 80;

const exts = new Set(['.png', '.jpg', '.jpeg']);

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // directory absent (e.g. no teasers) — nothing to do
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (exts.has(extname(e.name).toLowerCase())) yield p;
  }
}

export function compressTeasers(): Plugin {
  let outDir = 'dist';
  return {
    name: 'compress-teasers',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    async closeBundle() {
      let before = 0;
      let after = 0;
      let count = 0;

      for (const { dir, maxWidth } of TARGETS) {
        const root = join(outDir, 'source', dir);
        for await (const file of walk(root)) {
          const orig = await readFile(file);
          const ext = extname(file).toLowerCase();
          const pipeline = sharp(orig).resize({
            width: maxWidth,
            withoutEnlargement: true,
          });
          const out =
            ext === '.png'
              ? await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer()
              : await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();

          // Keep whichever is smaller — never inflate an already-tiny image.
          if (out.length < orig.length) {
            await writeFile(file, out);
            after += out.length;
          } else {
            after += orig.length;
          }
          before += orig.length;
          count++;
        }
      }

      if (count > 0) {
        const mb = (n: number) => (n / 1024 / 1024).toFixed(2);
        this.info?.(
          `compress-teasers: ${count} images, ${mb(before)} MB -> ${mb(after)} MB`,
        );
      }
    },
  };
}
