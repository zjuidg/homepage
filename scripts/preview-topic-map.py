"""Build a topic-constrained, merged-Voronoi paper-map preview from cached embeddings.

Requires numpy and Pillow. Does not call an API or replace the live paper map.
Usage: python3 scripts/preview-topic-map.py --output /absolute/output/directory
"""

import argparse
import hashlib
import html
import json
import re
from collections import Counter, defaultdict, deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
MODEL = "text-embedding-3-small"
WIDTH, HEIGHT = 2300, 1700
BACKGROUND = "#10151e"
INK = "#eaf0f3"
MUTED = "#98a6b7"
COLORS = {
    "sports-analytics": "#ffd2ad",
    "visualization-design": "#dccbff",
    "urban-geospatial": "#bcebd5",
    "data-wrangling": "#bfe0ff",
    "social-behavior": "#ffc5cd",
    "model-mechanisms": "#bceee7",
    "industrial-analytics": "#e7edb3",
    "cultural-heritage": "#f7c8e5",
    "perception-interaction": "#cdd5ff",
    "time-series-analysis": "#cfebbb",
    "health-analytics": "#ffe0cf",
    "causal-analysis": "#ffedba",
    "graph-analytics": "#bce4f1",
    "research-evaluation": "#e1ebcc",
    "multimodal-analytics": "#f4dec5",
}


def normalize_rows(values):
    return values / np.maximum(np.linalg.norm(values, axis=1, keepdims=True), 1e-12)


def classical_mds(distances):
    n = len(distances)
    j = np.eye(n) - np.ones((n, n)) / n
    gram = -0.5 * j @ (distances ** 2) @ j
    values, vectors = np.linalg.eigh(gram)
    order = np.argsort(values)[-2:][::-1]
    result = vectors[:, order] * np.sqrt(np.maximum(values[order], 0))
    # Resolve eigenvector sign ambiguity for reproducible orientation.
    for axis in range(2):
        if result[np.argmax(np.abs(result[:, axis])), axis] < 0:
            result[:, axis] *= -1
    return result


def load_data():
    pubs = json.loads((ROOT / "public/source/publications.json").read_text())
    cache = json.loads((ROOT / "scripts/.cache/paper-embeddings.json").read_text())
    docs = (ROOT / "docs/publication-categories.md").read_text()
    labels = {
        cid: {"en": en.strip(), "zh": zh.strip()}
        for cid, en, zh in re.findall(
            r"^\| `([^`]+)` \| ([^|]+) \| ([^|]+) \| \d+ \|$", docs, re.M
        )
    }
    vectors = []
    for paper in pubs:
        text = "\n\n".join(str(paper[k]) for k in ("title", "abstract") if paper.get(k))
        key = hashlib.sha1(f"{MODEL}\0{text}".encode()).hexdigest()
        if key not in cache:
            raise ValueError(f"Missing cached embedding for {paper['id']}; regenerate embeddings first.")
        vectors.append(cache[key])
        assert paper["category"] in labels
    return pubs, normalize_rows(np.asarray(vectors, dtype=float)), labels


def minimum_spanning_tree(distances, indices=None):
    indices = np.arange(len(distances)) if indices is None else np.asarray(indices)
    in_tree = np.zeros(len(indices), dtype=bool)
    in_tree[0] = True
    best = distances[indices[0], indices].copy()
    parent = np.zeros(len(indices), dtype=int)
    result = []
    for _ in range(len(indices) - 1):
        candidates = np.where(in_tree, np.inf, best)
        child = int(np.argmin(candidates))
        result.append((int(indices[parent[child]]), int(indices[child])))
        in_tree[child] = True
        improved = distances[indices[child], indices] < best
        best[improved] = distances[indices[child], indices[improved]]
        parent[improved] = child
    return result


def force_layout(embeddings, membership, seed, topic_strength, semantic_strength, backbone_floors=None):
    """Sparse semantic and within-topic springs with soft, local topic separation."""
    rng = np.random.default_rng(seed)
    n, k = len(embeddings), int(membership.max()) + 1
    counts = np.bincount(membership)
    similarity = np.clip(embeddings @ embeddings.T, -1, 1)
    semantic_distance = np.sqrt(np.maximum(2 - 2 * similarity, 0))
    global_xy = classical_mds(semantic_distance)
    centroids = normalize_rows(np.array([embeddings[membership == c].mean(0) for c in range(k)]))
    topic_dist = np.sqrt(np.maximum(2 - 2 * centroids @ centroids.T, 0))
    anchors = classical_mds(topic_dist)
    anchors *= 3.8 / max(np.std(anchors), 1e-6)
    anchors[:, 0] *= 1.15
    initial_scales = 0.42 + 0.235 * np.sqrt(counts)
    positions = np.empty((n, 2))
    for c in range(k):
        idx = np.flatnonzero(membership == c)
        xy = classical_mds(semantic_distance[np.ix_(idx, idx)])
        u, _, vt = np.linalg.svd(xy.T @ (global_xy[idx] - global_xy[idx].mean(0)))
        xy = xy @ (u @ vt)
        xy *= initial_scales[c] / max(np.sqrt(np.mean(np.sum(xy * xy, axis=1))), 1e-8)
        positions[idx] = anchors[c] + xy * .65 + rng.normal(0, .008, xy.shape)
    ranked = similarity.copy()
    np.fill_diagonal(ranked, -np.inf)
    nearest = np.argsort(-ranked, axis=1)[:, :8]
    adjacency = np.zeros((n, n), dtype=bool)
    adjacency[np.arange(n)[:, None], nearest] = True
    adjacency |= adjacency.T
    same_topic = membership[:, None] == membership[None, :]
    affinities = np.exp((similarity - .65) * 12)
    weights = np.where(adjacency, affinities, 0)
    weights *= np.where(same_topic, 1.0, .10)
    # Sparse same-topic links keep semantic branches together without a circular enclosure.
    for c in range(k):
        idx = np.flatnonzero(membership == c)
        for i in idx:
            closest = idx[np.argsort(-ranked[i, idx])[:min(2, len(idx) - 1)]]
            for j in closest:
                weights[i, j] = weights[j, i] = max(weights[i, j], .015 + affinities[i, j])
        for i, j in minimum_spanning_tree(semantic_distance, idx):
            backbone_strength = 1.0 if len(idx) <= 4 else .50 if len(idx) <= 8 else .035
            backbone_strength = max(backbone_strength, (backbone_floors or {}).get(c, 0.))
            weights[i, j] = weights[j, i] = max(weights[i, j], backbone_strength)
    target = .12 + 4 * np.maximum(1 - similarity, 0) ** 2.7
    local_similarity = np.take_along_axis(similarity, nearest, axis=1).mean(1)
    charge = .65 + 1.5 * (1 - local_similarity)
    base_repulsion = np.where(same_topic, .0028, .020) * np.sqrt(charge[:, None] * charge[None, :])
    np.fill_diagonal(base_repulsion, 0)
    velocity = np.zeros_like(positions)
    for iteration in range(4000):
        delta = positions[:, None, :] - positions[None, :, :]
        distance = np.sqrt(np.sum(delta * delta, axis=2) + 1e-9)
        unit = delta / distance[:, :, None]
        magnitude = base_repulsion / np.maximum(distance ** 2, .012)
        magnitude *= np.where(same_topic, 1., np.exp(-distance ** 2 / 9))
        magnitude -= semantic_strength * weights * (distance - target)
        collision = .75 * np.maximum(.16 - distance, 0)
        np.fill_diagonal(collision, 0)
        force = ((magnitude + collision)[:, :, None] * unit).sum(1)
        force += topic_strength * (anchors[membership] - positions)
        dt = .30 * (1 - .65 * iteration / 4000)
        velocity = .75 * velocity + dt * force
        positions += dt * velocity
    return positions, anchors, adjacency, similarity


def convex_hull(points):
    points = sorted(set(map(tuple, points)))
    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower, upper = [], []
    for p in points:
        while len(lower) > 1 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(points):
        while len(upper) > 1 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return np.array(lower[:-1] + upper[:-1])


def clip_halfplane(polygon, normal, offset):
    result = []
    if not len(polygon):
        return result
    previous = polygon[-1]
    previous_distance = float(np.dot(previous, normal) - offset)
    for current in polygon:
        distance = float(np.dot(current, normal) - offset)
        if (distance <= 1e-9) != (previous_distance <= 1e-9):
            t = previous_distance / (previous_distance - distance)
            result.append(previous + t * (current - previous))
        if distance <= 1e-9:
            result.append(current)
        previous, previous_distance = current, distance
    return result


def signed_area(polygon):
    p = np.asarray(polygon)
    return float(0.5 * np.sum(p[:, 0] * np.roll(p[:, 1], -1) - p[:, 1] * np.roll(p[:, 0], -1)))


def voronoi_cells(sites, domain, sea_sites=None):
    all_sites = sites if sea_sites is None else np.vstack((sites, sea_sites))
    cells = []
    for i, p in enumerate(sites):
        polygon = list(domain)
        order = np.argsort(np.sum((all_sites - p) ** 2, axis=1))
        for j in order:
            if j == i:
                continue
            normal = all_sites[j] - p
            offset = 0.5 * (np.dot(all_sites[j], all_sites[j]) - np.dot(p, p))
            polygon = clip_halfplane(polygon, normal, offset)
        rounded = []
        for v in polygon:
            vertex = tuple(np.round(v, 8))
            if not rounded or vertex != rounded[-1]:
                rounded.append(vertex)
        if len(rounded) > 1 and rounded[0] == rounded[-1]:
            rounded.pop()
        assert len(rounded) >= 3 and signed_area(rounded) > 0, i
        cells.append(rounded)
    return cells


def merge_regions(cells, membership):
    edges = defaultdict(list)
    for i, cell in enumerate(cells):
        for a, b in zip(cell, cell[1:] + cell[:1]):
            if a != b:
                edges[tuple(sorted((a, b)))].append((i, a, b))
    assert all(len(v) in (1, 2) for v in edges.values())
    region_edges = defaultdict(list)
    visible_edges, neighbors = [], defaultdict(set)
    for owners in edges.values():
        if len(owners) == 2:
            i, j = owners[0][0], owners[1][0]
            neighbors[i].add(j)
            neighbors[j].add(i)
            if membership[i] == membership[j]:
                continue
        visible_edges.append((owners[0][1], owners[0][2], len(owners) == 1))
        for i, a, b in owners:
            region_edges[int(membership[i])].append((a, b))

    regions, components = {}, {}
    for c in sorted(set(membership)):
        remaining = set(np.flatnonzero(membership == c).tolist())
        component_count = 0
        while remaining:
            component_count += 1
            todo = [remaining.pop()]
            while todo:
                for j in neighbors[todo.pop()]:
                    if j in remaining:
                        remaining.remove(j)
                        todo.append(j)
        components[int(c)] = component_count
        unused = set(region_edges[int(c)])
        outgoing = defaultdict(set)
        for a, b in unused:
            outgoing[a].add(b)
        loops = []
        while unused:
            a, b = min(unused)
            start, ring = a, [a]
            while True:
                unused.remove((a, b))
                outgoing[a].remove(b)
                if b == start:
                    break
                ring.append(b)
                candidates = outgoing[b]
                if len(candidates) != 1:
                    raise ValueError("A region boundary failed to form a simple closed cycle.")
                a, b = b, next(iter(candidates))
            loops.append(ring)
        regions[int(c)] = loops
    return regions, visible_edges, components, neighbors


def coast_cells(positions, clearance_factor=1.3):
    """Exterior Voronoi sites trim empty margins while preserving inland cells."""
    distances = np.linalg.norm(positions[:, None, :] - positions[None, :, :], axis=2)
    tree = minimum_spanning_tree(distances)
    # The clearance spans the widest local gap in a connected paper graph.
    clearance = max(1.0, max(distances[i, j] for i, j in tree) * clearance_factor)
    step = clearance / 8
    low, high = positions.min(0) - clearance * 2, positions.max(0) + clearance * 2
    xs, ys = np.arange(low[0], high[0] + step, step), np.arange(low[1], high[1] + step, step)
    grid = np.array(np.meshgrid(xs, ys)).reshape(2, -1).T
    nearest = np.concatenate([
        np.linalg.norm(grid[start:start + 512, None, :] - positions[None, :, :], axis=2).min(1)
        for start in range(0, len(grid), 512)
    ])
    water = (nearest >= clearance).reshape(len(ys), len(xs))
    ocean = np.zeros_like(water)
    todo = deque([(0, 0)])
    ocean[0, 0] = True
    while todo:
        y, x = todo.popleft()
        for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= yy < len(ys) and 0 <= xx < len(xs) and water[yy, xx] and not ocean[yy, xx]:
                ocean[yy, xx] = True
                todo.append((yy, xx))
    angles = np.arange(64) * 2 * np.pi / 64
    offsets = clearance * np.column_stack((np.cos(angles), np.sin(angles)))
    candidates = (positions[:, None, :] + offsets[None, :, :]).reshape(-1, 2)
    nearest = np.concatenate([
        np.linalg.norm(candidates[start:start + 512, None, :] - positions[None, :, :], axis=2).min(1)
        for start in range(0, len(candidates), 512)
    ])
    candidates = candidates[nearest >= clearance - 1e-8]
    sea_sites, seen = [], set()
    for p in candidates:
        x, y = np.rint((p - low) / step).astype(int)
        if not ocean[max(0, y - 1):y + 2, max(0, x - 1):x + 2].any():
            continue
        key = tuple(np.rint(p / (clearance / 24)).astype(int))
        if key not in seen:
            seen.add(key)
            sea_sites.append(p)
    sea_sites = np.asarray(sea_sites)
    enclosing_box = np.array([low, [high[0], low[1]], high, [low[0], high[1]]])
    cells = voronoi_cells(positions, enclosing_box, sea_sites)
    land, _, components, _ = merge_regions(cells, np.zeros(len(cells), dtype=int))
    if components[0] != 1 or len(land[0]) != 1:
        raise ValueError("Exterior seeds split the map or create an inland hole.")
    return cells, np.asarray(land[0][0]), len(sea_sites), clearance


def fit_map(positions, domain, cells):
    lower, upper = domain.min(0), domain.max(0)
    box_low, box_high = np.array([72, 246]), np.array([1800, 1550])
    scale = min((box_high - box_low) / (upper - lower))
    shift = (box_low + box_high) / 2 - (lower + upper) / 2 * scale
    scaled_cells = [[tuple(np.round(np.asarray(p) * scale + shift, 6)) for p in cell] for cell in cells]
    return positions * scale + shift, domain * scale + shift, scaled_cells, scale, shift


def point_in_polygon(points, polygon):
    inside = np.zeros(len(points), dtype=bool)
    for a, b in zip(polygon, np.roll(polygon, -1, axis=0)):
        if abs(b[1] - a[1]) < 1e-12:
            continue
        crosses = (a[1] > points[:, 1]) != (b[1] > points[:, 1])
        x_intersection = (b[0] - a[0]) * (points[:, 1] - a[1]) / (b[1] - a[1]) + a[0]
        inside ^= crosses & (points[:, 0] < x_intersection)
    return inside


def font_path(cjk=False):
    candidates = (
        ["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"]
        if cjk else ["/System/Library/Fonts/Supplemental/Arial.ttf"]
    )
    for p in candidates:
        if Path(p).exists():
            return p
    raise ValueError("No suitable font found; set a local CJK font in font_path().")


def text_size(text, size, cjk=True):
    font = ImageFont.truetype(font_path(cjk), size)
    return font.getlength(text), size * 1.25


def segment_intersects_box(a, b, box):
    low, high = np.asarray(box[:2]), np.asarray(box[2:])
    start, direction = np.asarray(a), np.asarray(b) - np.asarray(a)
    entry, leave = 0.0, 1.0
    for axis in range(2):
        if abs(direction[axis]) < 1e-10:
            if start[axis] < low[axis] or start[axis] > high[axis]:
                return False
        else:
            first, last = sorted(((low[axis] - start[axis]) / direction[axis],
                                  (high[axis] - start[axis]) / direction[axis]))
            entry, leave = max(entry, first), min(leave, last)
            if entry > leave:
                return False
    return True


def place_labels(sites, membership, domain, categories, labels, regions):
    xs = np.arange(domain[:, 0].min() + 10, domain[:, 0].max() - 10, 6)
    ys = np.arange(domain[:, 1].min() + 10, domain[:, 1].max() - 10, 6)
    grid = np.array(np.meshgrid(xs, ys)).reshape(2, -1).T
    grid = grid[point_in_polygon(grid, domain)]
    assignments, clearance = [], []
    for start in range(0, len(grid), 512):
        ds = np.sum((grid[start:start + 512, None, :] - sites[None, :, :]) ** 2, axis=2)
        assignments.extend(membership[np.argmin(ds, axis=1)])
        clearance.extend(np.sqrt(ds.min(1)))
    assignments, clearance = np.asarray(assignments), np.asarray(clearance)
    result, occupied = {}, []
    for c in sorted(range(len(categories)), key=lambda c: np.sum(membership == c)):
        idx = np.flatnonzero(assignments == c)
        center = sites[membership == c].mean(0)
        score = clearance[idx] - 0.10 * np.linalg.norm(grid[idx] - center, axis=1)
        candidates = grid[idx[np.argsort(-score)]]
        chosen = None
        name = labels[categories[c]]["zh"]
        split = 3 if len(name) > 4 else 2
        formats = [(size, [name]) for size in (25, 23, 21, 19)]
        formats += [(size, [name[:split], name[split:]]) for size in (23, 21, 19, 17)]
        formats += [(size, [f"{c + 1:02d}"]) for size in (18, 14)]
        for size, lines in formats:
            badge = lines == [f"{c + 1:02d}"]
            w = max(text_size(line, size)[0] for line in lines) + (6 if badge else 22)
            h = size * 1.3 * len(lines) + (4 if badge else 14)
            for candidate in candidates:
                x, y = candidate
                box = [x - w / 2, y - h / 2, x + w / 2, y + h / 2]
                probes = np.array([[x + dx * w / 2, y + dy * h / 2] for dx in (-1, 0, 1) for dy in (-1, 0, 1)])
                if not point_in_polygon(probes, domain).all():
                    continue
                closest = np.argmin(np.sum((probes[:, None, :] - sites[None, :, :]) ** 2, axis=2), axis=1)
                if not np.all(membership[closest] == c):
                    continue
                if any(segment_intersects_box(a, b, box)
                       for ring in regions[c] for a, b in zip(ring, ring[1:] + ring[:1])):
                    continue
                overlaps = (np.abs(sites[:, 0] - x) < w / 2 + 8) & (np.abs(sites[:, 1] - y) < h / 2 + 8)
                if overlaps.any():
                    continue
                if any(not (box[2] < b[0] - 8 or box[0] > b[2] + 8 or box[3] < b[1] - 8 or box[1] > b[3] + 8) for b in occupied):
                    continue
                chosen = {"x": float(x), "y": float(y), "size": size, "box": box, "lines": lines}
                break
            if chosen:
                break
        if not chosen:
            raise ValueError(f"No non-overlapping internal label position for {categories[c]}")
        result[c] = chosen
        occupied.append(chosen["box"])
    return result


def rgb(color):
    return tuple(int(color[i:i + 2], 16) for i in (1, 3, 5))


def mix(a, b, fraction):
    return "#" + "".join(f"{round(x * (1 - fraction) + y * fraction):02x}" for x, y in zip(rgb(a), rgb(b)))


class Canvas:
    def __init__(self, paper_count, category_count):
        self.scale = 2
        self.image = Image.new("RGB", (WIDTH * self.scale, HEIGHT * self.scale), BACKGROUND)
        self.draw = ImageDraw.Draw(self.image)
        self.svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">',
                    '<title>论文主题地图</title>',
                    f'<desc>{paper_count} papers in {category_count} topics, topic-constrained force layout, merged paper Voronoi regions. Hover a dot for its paper title.</desc>',
                    f'<rect width="{WIDTH}" height="{HEIGHT}" fill="{BACKGROUND}"/>']

    def line(self, a, b, fill, width=1):
        self.draw.line(tuple(v * self.scale for p in (a, b) for v in p), fill=fill, width=max(1, round(width * self.scale)))
        self.svg.append(f'<path d="M{a[0]:.3f},{a[1]:.3f}L{b[0]:.3f},{b[1]:.3f}" stroke="{fill}" stroke-width="{width}" stroke-linecap="round"/>')

    def region(self, loops, fill):
        data = " ".join("M" + "L".join(f"{x:.3f},{y:.3f}" for x, y in ring) + "Z" for ring in loops)
        for ring in loops:
            self.draw.polygon([(x * self.scale, y * self.scale) for x, y in ring], fill=fill)
        self.svg.append(f'<path d="{data}" fill="{fill}" fill-rule="evenodd"/>')

    def circle(self, x, y, r, fill, title=None):
        self.draw.ellipse(tuple(v * self.scale for v in (x - r, y - r, x + r, y + r)), fill=fill)
        tag = f'<circle cx="{x:.3f}" cy="{y:.3f}" r="{r}" fill="{fill}">'
        self.svg.append(tag + (f'<title>{html.escape(title)}</title>' if title else '') + '</circle>')

    def rect(self, box, fill, radius=0):
        self.draw.rounded_rectangle(tuple(v * self.scale for v in box), radius=radius * self.scale, fill=fill)
        x, y, x2, y2 = box
        self.svg.append(f'<rect x="{x}" y="{y}" width="{x2 - x}" height="{y2 - y}" rx="{radius}" fill="{fill}"/>')

    def text(self, x, y, value, size, fill=INK, cjk=True, anchor="left"):
        font = ImageFont.truetype(font_path(cjk), size * self.scale)
        width = font.getlength(value) / self.scale
        if anchor == "middle":
            x -= width / 2
        elif anchor == "right":
            x -= width
        self.draw.text((x * self.scale, y * self.scale), value, font=font, fill=fill, anchor="lt")
        family = "Heiti SC, Arial Unicode MS, sans-serif" if cjk else "Arial, sans-serif"
        self.svg.append(f'<text x="{x:.3f}" y="{y + size * .88:.3f}" fill="{fill}" font-family="{family}" font-size="{size}">{html.escape(value)}</text>')

    def save(self, destination):
        self.image.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS).save(destination / "paper-topic-map-preview.png")
        (destination / "paper-topic-map-preview.svg").write_text("\n".join(self.svg + ["</svg>"]))


def draw_map(pubs, sites, regions, edges, label_positions, categories, labels, destination):
    canvas = Canvas(len(pubs), len(categories))
    counts = Counter(p["category"] for p in pubs)
    canvas.text(72, 52, "IDG  /  RESEARCH ATLAS", 19, MUTED, cjk=False)
    canvas.text(68, 100, "论文主题地图", 54)
    canvas.text(73, 173, f"{len(pubs)} 篇论文  ·  {len(categories)} 个主题", 23, MUTED)
    canvas.text(2228, 174, "每个圆点代表一篇论文", 20, MUTED, anchor="right")
    canvas.line((72, 219), (2228, 219), "#303b4b", 1)

    for c, loops in regions.items():
        canvas.region(loops, mix(BACKGROUND, COLORS[categories[c]], .25))
    # Shared frontiers are drawn once. Internal paper-cell edges are removed.
    for a, b, coast in edges:
        canvas.line(a, b, "#8d9cab" if coast else "#748392", 1.9 if coast else 1.35)
    for p, (x, y) in zip(pubs, sites):
        canvas.circle(x, y, 4.4, mix(COLORS[p["category"]], "#ffffff", .12), p["title"])
    for c, item in label_positions.items():
        color = COLORS[categories[c]]
        canvas.rect(item["box"], mix(BACKGROUND, color, .14), 7)
        line_height = item["size"] * 1.3
        for i, line in enumerate(item["lines"]):
            y = item["y"] - (len(item["lines"]) - 1) * line_height / 2 - item["size"] * .48 + i * line_height
            canvas.text(item["x"], y, line, item["size"], mix(color, "#ffffff", .45), anchor="middle")

    canvas.line((1850, 253), (1850, 1555), "#303b4b", 1)
    canvas.text(1890, 254, "研究主题", 24)
    canvas.text(2225, 257, "篇数", 18, MUTED, anchor="right")
    order = sorted(categories, key=lambda cid: -counts[cid])
    for i, cid in enumerate(order):
        y = 321 + i * 75
        c = categories.index(cid)
        if label_positions[c]["lines"] == [f"{c + 1:02d}"]:
            canvas.text(1900, y + 2, f"{c + 1:02d}", 15, COLORS[cid], cjk=False, anchor="middle")
        else:
            canvas.circle(1900, y + 10, 5, COLORS[cid])
        canvas.text(1920, y, labels[cid]["zh"], 22)
        canvas.text(2225, y + 1, str(counts[cid]), 22, COLORS[cid], cjk=False, anchor="right")
        canvas.text(1920, y + 30, labels[cid]["en"], 16, MUTED, cjk=False)
        if i < len(order) - 1:
            canvas.line((1890, y + 60), (2228, y + 60), "#222d3b", .8)
    canvas.line((72, 1590), (2228, 1590), "#303b4b", 1)
    canvas.text(72, 1622, "标题与摘要嵌入  /  主题约束力导向  /  Voronoi 区域合并", 20, MUTED)
    canvas.text(2228, 1623, "LAYOUT PREVIEW · 2026.10", 17, MUTED, cjk=False, anchor="right")
    canvas.save(destination)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--topic-strength", type=float, default=.002)
    parser.add_argument("--semantic-strength", type=float, default=.35)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    pubs, embeddings, labels = load_data()
    categories = list(labels)
    membership = np.array([categories.index(p["category"]) for p in pubs])
    print(f"Layout: {len(pubs)} cached embeddings, {len(categories)} topics", flush=True)
    positions, anchors, adjacency, similarity = force_layout(embeddings, membership, args.seed, args.topic_strength, args.semantic_strength)
    cells, domain, sea_count, clearance = coast_cells(positions)
    sites, domain, cells, scale, shift = fit_map(positions, domain, cells)
    regions, edges, components, neighbors = merge_regions(cells, membership)
    if any(count != 1 for count in components.values()):
        raise ValueError(f"Disconnected topic regions: {components}")
    if any(len(loops) != 1 for loops in regions.values()):
        raise ValueError("A region contains a hole; adjust layout constraints before rendering.")
    total_area = sum(signed_area(c) for c in cells)
    domain_area = signed_area(domain)
    assert abs(total_area - domain_area) / domain_area < 1e-7
    for c, loops in regions.items():
        expected = sum(signed_area(cells[i]) for i in np.flatnonzero(membership == c))
        assert abs(sum(signed_area(loop) for loop in loops) - expected) < 0.01
    label_positions = place_labels(sites, membership, domain, categories, labels, regions)
    distances = np.linalg.norm(sites[:, None, :] - sites[None, :, :], axis=2)
    np.fill_diagonal(distances, np.inf)
    assert distances.min() > 9, "Paper markers overlap."
    draw_map(pubs, sites, regions, edges, label_positions, categories, labels, args.output)
    same = membership[:, None] == membership[None, :]
    semantic_k = np.argsort(-np.where(np.eye(len(pubs)), -np.inf, similarity), axis=1)[:, :8]
    visual_k = np.argsort(distances, axis=1)[:, :8]
    overlap = np.mean([len(set(a) & set(b)) / 8 for a, b in zip(semantic_k, visual_k)])
    metrics = {
        "paper_count": len(pubs), "category_count": len(categories),
        "semantic_graph_edges": int(adjacency.sum() // 2),
        "cross_topic_semantic_edges": int((adjacency & ~same).sum() // 2),
        "connected_components": {categories[c]: count for c, count in components.items()},
        "region_holes": 0, "area_coverage_relative_error": abs(total_area - domain_area) / domain_area,
        "minimum_marker_distance_px": float(distances.min()),
        "nonoverlapping_internal_labels": len(label_positions),
        "numbered_label_badges": sum(item["lines"] == [f"{c + 1:02d}"] for c, item in label_positions.items()),
        "embedding_top8_neighbor_recall_in_2d": float(overlap),
        "nearest_neighbor_distance_cv": float(distances.min(1).std() / distances.min(1).mean()),
        "land_area_to_convex_hull_ratio": float(domain_area / signed_area(convex_hull(domain))),
    }
    data = {
        "model": MODEL, "seed": args.seed,
        "method": "Cosine kNN springs + within-topic semantic kNN and MST springs + weak topic-centroid attraction + local repulsion + collision, without hard topic enclosures. Exterior ocean sites trim ordinary paper Voronoi cells; shared same-category edges are removed.",
        "parameters": {"neighbors": 8, "within_topic_neighbors": 2, "topic_strength": args.topic_strength, "semantic_strength": args.semantic_strength, "inter_topic_link_scale": .10, "affinity": "exp(12 * (cosine_similarity - 0.65))", "spring_length": "0.12 + 4 * (1 - cosine_similarity)^2.7", "sea_site_count": sea_count, "sea_site_clearance": clearance},
        "canvas": {"width": WIDTH, "height": HEIGHT}, "metrics": metrics,
        "papers": [dict(id=p["id"], title=p["title"], category=p["category"], x=float(xy[0]), y=float(xy[1]), cell=cells[i]) for i, (p, xy) in enumerate(zip(pubs, sites))],
        "regions": {categories[c]: {"label": labels[categories[c]], "rings": loops, "label_position": label_positions[c]} for c, loops in regions.items()},
        "domain": domain.tolist(),
        "topic_anchors": {categories[c]: (anchors[c] * scale + shift).tolist() for c in range(len(categories))},
    }
    (args.output / "paper-topic-map-layout.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    (args.output / "paper-topic-map-notes.md").write_text(
        "# 论文主题地图预览\n\n"
        f"数据：{len(pubs)} 篇论文，{len(categories)} 个单标签主题。嵌入来自现有缓存，模型为 `{MODEL}`，输入为标题与可用摘要。\n\n"
        "主题中心以本主题论文的平均嵌入计算，用经典 MDS 初始化。论文层面取余弦相似度前 8 个邻居并对称化，"
        "补充同主题前 2 近邻和语义最小生成树连接，施加语义弹簧、很弱的主题中心吸引、节点排斥与碰撞约束。"
        "弹簧权重和目标长度随语义相似度变化，突出局部聚集和较弱的分支联系。小主题的生成树连接更强，防止区域破碎。"
        "跨主题语义弹簧权重系数为 0.10。没有圆形主题范围或硬半径约束。局部密度影响排斥强度，布局使用固定随机种子。\n\n"
        "以每篇论文的位置为种子计算普通 Voronoi。在论文外围的可达海域增加辅助种子，裁去远离论文的空白，形成凹凸外边界。"
        "辅助种子不代表论文，也不显示。再消去同主题单元的公共边形成主题多边形。"
        "邻接区域共用同一组边；没有分别平滑边界。图中不显示语义网络的连线。\n\n"
        f"验证：{len(pubs)} 个有效单元完整覆盖裁剪范围；{len(categories)} 个主题各为一个连通区域，无孔洞；"
        f"标签全部位于本区域内，且未遮挡论文节点。小区域必要时用编号对应右侧图例。最小节点间距为 {distances.min():.1f} 像素。\n\n"
        f"全局嵌入前 8 邻居在二维中的平均保留率为 {overlap:.1%}。主题约束会改变原始近邻关系，"
        "地图距离用于表达大致语义邻近，区域面积未按论文数量严格标定。\n\n"
        "文件：PNG 为预览图，SVG 为可缩放版本且圆点含论文标题，JSON 保存节点坐标、单元和合并边界。\n\n"
        "复现：在仓库根目录使用安装了 NumPy 和 Pillow 的 Python 运行 "
        "`python3 scripts/preview-topic-map.py --output <输出目录>`。"
        f"本图参数：seed={args.seed}，topic-strength={args.topic_strength}，semantic-strength={args.semantic_strength}。\n"
    )
    print(json.dumps(metrics, ensure_ascii=False, indent=2), flush=True)
    print(f"Saved preview to {args.output}", flush=True)


if __name__ == "__main__":
    main()
