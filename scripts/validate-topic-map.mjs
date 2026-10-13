import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const pubs = JSON.parse(readFileSync(new URL('public/source/publications.json', root), 'utf8'));
const map = JSON.parse(readFileSync(process.argv[2] || new URL('public/source/paper-topic-map.json', root), 'utf8'));
const minimumMarkerSeparation = 9;
const area = (ring) => Math.abs(ring.reduce((sum, p, i) => {
  const q = ring[(i + 1) % ring.length];
  return sum + p[0] * q[1] - q[0] * p[1];
}, 0) / 2);
function inside([x, y], ring) {
  let result = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[i], [bx, by] = ring[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) result = !result;
  }
  return result;
}
function simple(ring) {
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    for (let j = i + 2; j < ring.length; j++) {
      if (i === 0 && j === ring.length - 1) continue;
      const c = ring[j], d = ring[(j + 1) % ring.length];
      if (cross(a, b, c) * cross(a, b, d) < -1e-9 && cross(c, d, a) * cross(c, d, b) < -1e-9) return false;
    }
  }
  return true;
}
const sources = new Map(pubs.map((p) => [p.id, p]));
assert.equal(map.papers.length, pubs.length);
assert.equal(new Set(map.papers.map((p) => p.id)).size, pubs.length);
// Both generators serialize this ordered tuple list as compact UTF-8 JSON.
const hashInput = JSON.stringify(pubs.map((p) => [p.id, p.category, p.title, p.abstract || '']));
assert.equal(map.sourceHash, createHash('sha256').update(hashInput).digest('hex'), 'Stale map data; regenerate the topic map.');
const counts = new Map();
for (const p of pubs) counts.set(p.category, (counts.get(p.category) || 0) + 1);
assert.equal(map.regions.length, counts.size);
assert.equal(new Set(map.regions.map((r) => r.category)).size, counts.size);
const total = map.regions.reduce((sum, region) => sum + area(region.rings[0]), 0);
const averageCellArea = total / pubs.length;
let maxCellRatio = 0;
for (const region of map.regions) {
  assert.equal(region.rings.length, 1, `${region.category}: disconnected region or hole`);
  assert(simple(region.rings[0]), `${region.category}: crossed boundary`);
  assert.equal(region.count, counts.get(region.category));
  assert(Math.abs(region.area / area(region.rings[0]) - 1) < 1e-7, `${region.category}: stale area metadata`);
  assert(Math.abs(region.paperShare - region.count / pubs.length) < 1e-12, `${region.category}: incorrect paper share`);
  for (const slot of Object.values(region.labels)) {
    assert(inside([slot.x, slot.y], region.rings[0]), `${region.category}: label outside its region`);
  }
}
for (const paper of map.papers) {
  assert.equal(paper.category, sources.get(paper.id)?.category);
  assert(Number.isFinite(paper.x) && Number.isFinite(paper.y));
  assert(simple(paper.cell), `${paper.id}: crossed cell boundary`);
  const cellRatio = area(paper.cell) / averageCellArea;
  maxCellRatio = Math.max(maxCellRatio, cellRatio);
  // An ordinary Voronoi cell cannot contain a vertex closer to another paper.
  // Distance tolerance covers four-decimal rounding of both sites and vertices.
  for (const [x, y] of paper.cell) {
    const ownDistance = Math.hypot(x - paper.x, y - paper.y);
    const nearestDistance = Math.min(...map.papers.map((p) => Math.hypot(x - p.x, y - p.y)));
    assert(ownDistance - nearestDistance < .0003, `${paper.id}: cell is not an ordinary Voronoi cell`);
  }
  assert(inside([paper.x, paper.y], paper.cell), `${paper.id}: outside its cell`);
  assert(inside([paper.x, paper.y], map.regions.find((r) => r.category === paper.category).rings[0]), `${paper.id}: outside its topic`);
}
let minimumDistance = Infinity;
for (let i = 0; i < map.papers.length; i++) {
  for (let j = i + 1; j < map.papers.length; j++) {
    const a = map.papers[i], b = map.papers[j];
    minimumDistance = Math.min(minimumDistance, Math.hypot(a.x - b.x, a.y - b.y));
  }
}
assert(minimumDistance >= minimumMarkerSeparation * .999, 'Paper markers overlap.');
assert(Math.abs(total / area(map.coast) - 1) < 1e-7, 'Regions do not cover the land area.');
assert(simple(map.coast), 'The coastline crosses itself.');
assert(Math.abs(map.papers.reduce((sum, p) => sum + area(p.cell), 0) / total - 1) < 1e-7, 'Paper cells do not cover the regions.');
// Check interiors against the full partition, independently of Voronoi creation.
let checked = 0;
for (let y = 4.123; y < map.height; y += 11.37) {
  for (let x = 3.456; x < map.width; x += 11.73) {
    const land = inside([x, y], map.coast);
    const owners = map.regions.filter((r) => inside([x, y], r.rings[0])).length;
    assert.equal(owners, land ? 1 : 0, `Gap or overlap at ${x}, ${y}`);
    checked++;
  }
}
console.log(`${map.papers.length} papers, ${map.regions.length} connected regions, ${checked} partition samples.`);
console.log('Ordinary Voronoi geometry verified; no topic or cell area targets.');
console.log(`Largest paper cell: ${maxCellRatio.toFixed(3)} times the mean area.`);
console.log(`Minimum marker distance: ${minimumDistance.toFixed(3)} (limit: ${minimumMarkerSeparation}).`);
