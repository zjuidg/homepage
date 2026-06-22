import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import type { Plugin } from 'vite';
import sharp from 'sharp';

/**
 * Paper teaser images live in `public/source/projects/**` and are copied to the
 * build verbatim by Vite (anything under `public/` bypasses the asset pipeline).
 * The committed sources are full-resolution (some are >10000px wide), but the
 * publication card only ever renders the thumbnail at 180px (desktop) / 220px
 * (mobile, single column). This plugin downscales + recompresses the copies in
 * `dist/` to 2x the largest rendered size, so the deployed images are crisp on
 * HiDPI screens without shipping multi-megabyte originals.
 *
 * Only the build output is rewritten — the committed sources in `public/` are
 * left untouched.
 */

// 2x the largest rendered thumbnail width (220px on mobile single-column).
const MAX_WIDTH = 440;
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
      const root = join(outDir, 'source', 'projects');
      let before = 0;
      let after = 0;
      let count = 0;

      for await (const file of walk(root)) {
        const orig = await readFile(file);
        const ext = extname(file).toLowerCase();
        const pipeline = sharp(orig).resize({
          width: MAX_WIDTH,
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

      if (count > 0) {
        const mb = (n: number) => (n / 1024 / 1024).toFixed(2);
        this.info?.(
          `compress-teasers: ${count} images, ${mb(before)} MB -> ${mb(after)} MB`,
        );
      }
    },
  };
}
