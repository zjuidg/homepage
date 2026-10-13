/** Project batches with exact cosine neighbors supplied by compute-topic-map.py. */
import assert from 'node:assert/strict';
import { UMAP } from 'umap-js';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const batches = JSON.parse(input);
const positions = batches.map(({ embeddings, indices, distances }) => {
  const nNeighbors = indices[0].length;
  assert(nNeighbors > 1 && nNeighbors < embeddings.length);
  for (let i = 0; i < embeddings.length; i++) {
    assert.equal(indices[i][0], i, 'The first neighbor must be the point itself.');
    // Even tiny positive self-distances change UMAP's local connectivity radius.
    assert.equal(distances[i][0], 0, 'Self-distance must be exactly zero.');
    assert.equal(indices[i].length, nNeighbors);
    assert.equal(distances[i].length, nNeighbors);
    assert(distances[i].every((d) => Number.isFinite(d) && d >= 0));
  }
  let seed = 42;
  const random = () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const umap = new UMAP({
    nComponents: 2, nNeighbors, minDist: .1, spread: 1, nEpochs: 700, random,
  });
  umap.setPrecomputedKNN(indices, distances);
  return umap.fit(embeddings);
});
process.stdout.write(JSON.stringify(positions));
