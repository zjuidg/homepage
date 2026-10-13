"""Compute a semantic topic map with natural area from node repulsion.

Uses NumPy and Pillow. Semantic neighbors and weak topic constraints guide the
nodes; equal node charges and collision handling provide space. Ordinary paper
Voronoi cells are merged by topic, without area targets or polygon deformation.
"""

import argparse
import hashlib
import importlib.util
import json
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("preview", ROOT / "scripts/preview-topic-map.py")
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)

MIN_MARKER_SEPARATION = 9.0
CANVAS = np.array([1100, 800])
COAST_CLEARANCE_FACTOR = .75
FORCE_ITERATIONS = 2200
UMAP_NEIGHBORS = 4
GLOBAL_NEIGHBORS = 12
CROSS_TOPIC_STRENGTH = .02
ORIENTATION_PASSES = 20


def neighbor_probabilities(squared_distances, perplexity):
    """Symmetric Gaussian affinities with a separate bandwidth for each paper."""
    n = len(squared_distances)
    probabilities = np.zeros((n, n))
    for i in range(n):
        others = np.arange(n) != i
        distances = squared_distances[i, others]
        beta, lower, upper = 1., 0., np.inf
        for _ in range(70):
            row = np.exp(-beta * (distances - distances.min()))
            row /= row.sum()
            entropy = -np.sum(row * np.log(np.maximum(row, 1e-12)))
            if abs(entropy - np.log(perplexity)) < 1e-6:
                break
            if entropy > np.log(perplexity):
                lower = beta
                beta = (beta + upper) / 2 if np.isfinite(upper) else beta * 2
            else:
                upper = beta
                beta = (beta + lower) / 2
        probabilities[i, others] = row
    return (probabilities + probabilities.T) / (2 * n)


def neighbor_embedding(embeddings):
    """Exact, deterministic t-SNE for the small collection within one topic.

    The objective preserves local neighbors, not original-space density.
    See van der Maaten and Hinton, JMLR 9 (2008), equations 4 and 5.
    """
    n = len(embeddings)
    if n == 1:
        return np.zeros((1, 2))
    squared = np.maximum(2 - 2 * embeddings @ embeddings.T, 0)
    positions = preview.classical_mds(np.sqrt(squared))
    positions *= .001 / max(positions.std(), 1e-8)
    if n <= 3:
        return positions
    probabilities = neighbor_probabilities(squared, min(5., (n - 1) * .6))
    velocity = np.zeros_like(positions)
    gains = np.ones_like(positions)
    for iteration in range(1600):
        delta = positions[:, None, :] - positions[None, :, :]
        numerator = 1 / (1 + np.sum(delta * delta, axis=2))
        np.fill_diagonal(numerator, 0)
        low_probabilities = numerator / numerator.sum()
        exaggeration = 4 if iteration < 150 else 1
        gradient = 4 * (((exaggeration * probabilities - low_probabilities)
                         * numerator)[:, :, None] * delta).sum(1)
        gains = np.maximum(np.where((gradient > 0) != (velocity > 0), gains + .2, gains * .8), .01)
        velocity = (.5 if iteration < 150 else .8) * velocity - 15 * gains * gradient
        positions += velocity
        positions -= positions.mean(0)
    return positions


def semantic_metrics(sites, embeddings, membership):
    """Compare displayed nearest neighbors with original embedding neighbors."""
    similarity = embeddings @ embeddings.T
    np.fill_diagonal(similarity, -np.inf)
    distances = np.linalg.norm(sites[:, None, :] - sites[None, :, :], axis=2)
    np.fill_diagonal(distances, np.inf)
    result = {}
    for k in (3, 5, 8):
        count = min(k, len(sites) - 1)
        original = np.argsort(-similarity, axis=1)[:, :count]
        displayed = np.argsort(distances, axis=1)[:, :count]
        result[f"globalTop{k}Recall"] = float(np.mean([
            len(set(a) & set(b)) / count for a, b in zip(original, displayed)
        ]))
    for k in (3, 5):
        recalls = []
        for i in range(len(sites)):
            others = np.flatnonzero((membership == membership[i]) & (np.arange(len(sites)) != i))
            count = min(k, len(others))
            if not count:
                continue
            original = others[np.argsort(-similarity[i, others])[:count]]
            displayed = others[np.argsort(distances[i, others])[:count]]
            recalls.append(len(set(original) & set(displayed)) / count)
        result[f"withinTopicTop{k}Recall"] = float(np.mean(recalls))
    cross_topic = membership[:, None] != membership[None, :]
    cross_recalls = []
    cross_hits, cross_count = 0, 0
    for i in range(len(sites)):
        others = np.flatnonzero(cross_topic[i])
        count = min(3, len(others))
        if count:
            original = others[np.argsort(-similarity[i, others])[:count]]
            displayed = others[np.argsort(distances[i, others])[:count]]
            cross_recalls.append(len(set(original) & set(displayed)) / count)
        top = np.argsort(-similarity[i])[:min(8, len(sites) - 1)]
        cross = top[cross_topic[i, top]]
        cross_hits += len(set(cross) & set(np.argsort(distances[i])[:8]))
        cross_count += len(cross)
    result["crossTopicTop3Recall"] = float(np.mean(cross_recalls)) if cross_recalls else None
    result["globalCrossTop8Recall"] = cross_hits / cross_count if cross_count else None
    nearest = distances.min(1)
    result["nearestNeighborDistanceCV"] = float(nearest.std() / nearest.mean())
    result["minimumSeparation"] = float(nearest.min())
    return result


def cosine_neighbors(embeddings, count):
    """Exact cosine KNN, with an explicit zero-distance self entry first."""
    distance = np.maximum(1 - embeddings @ embeddings.T, 0)
    np.fill_diagonal(distance, np.inf)
    others = np.argsort(distance, axis=1, kind="stable")[:, :count - 1]
    indices = np.column_stack((np.arange(len(embeddings)), others))
    distances = np.column_stack((np.zeros(len(embeddings)), np.take_along_axis(distance, others, axis=1)))
    return indices, distances


def global_neighbor_graph(embeddings):
    """UMAP fuzzy union over exact global cosine neighbors, before categories.

    This uses UMAP's local-connectivity-one smooth KNN construction. Building
    the graph here avoids depending on private fields in the JS implementation.
    """
    count = min(GLOBAL_NEIGHBORS, len(embeddings))
    indices, distances = cosine_neighbors(embeddings, count)
    directed = np.zeros((len(embeddings), len(embeddings)))
    for i, row in enumerate(distances):
        positive = row[row > 0]
        rho = positive[0] if len(positive) else 0.
        delta = np.maximum(row[1:] - rho, 0)
        sigma, lower, upper = 1., 0., np.inf
        for _ in range(64):
            total = np.exp(-delta / sigma).sum()
            if abs(total - np.log2(count)) < 1e-5:
                break
            if total > np.log2(count):
                upper = sigma
            else:
                lower = sigma
            sigma = (lower + upper) / 2 if np.isfinite(upper) else sigma * 2
        floor = .001 * (row.mean() if rho > 0 else distances.mean())
        sigma = max(sigma, floor, 1e-12)
        directed[i, indices[i, 1:]] = np.exp(-delta / sigma)
    return directed + directed.T - directed * directed.T


def semantic_layout(embeddings, membership, categories, projection="umap"):
    """Project local groups before orienting them using global semantic links."""
    coarse, _, _, _ = preview.force_layout(embeddings, membership, 42, .002, .35)
    groups = [np.flatnonzero(membership == c) for c in range(len(categories))]
    local_positions = {}
    if projection == "umap":
        batches, batch_categories = [], []
        for c, idx in enumerate(groups):
            if len(idx) <= 2:
                distances = np.sqrt(np.maximum(2 - 2 * embeddings[idx] @ embeddings[idx].T, 0))
                local_positions[c] = preview.classical_mds(distances)
                continue
            indices, distances = cosine_neighbors(embeddings[idx], min(UMAP_NEIGHBORS, len(idx) - 1))
            batches.append({"embeddings": embeddings[idx].tolist(), "indices": indices.tolist(), "distances": distances.tolist()})
            batch_categories.append(c)
        if batches:
            result = subprocess.run(
                ["node", str(ROOT / "scripts/project-topic-umap.mjs")],
                input=json.dumps(batches), text=True, capture_output=True,
            )
            if result.returncode:
                raise RuntimeError(f"UMAP projection failed: {result.stderr.strip()}")
            for c, positions in zip(batch_categories, json.loads(result.stdout), strict=True):
                local_positions[c] = np.asarray(positions, dtype=float)
    else:
        local_positions = {c: neighbor_embedding(embeddings[idx]) for c, idx in enumerate(groups)}
    sites = np.empty_like(coarse)
    for c, idx in enumerate(groups):
        target = coarse[idx] - coarse[idx].mean(0)
        local = local_positions[c] - local_positions[c].mean(0)
        assert local.shape == (len(idx), 2) and np.isfinite(local).all()
        u, _, vt = np.linalg.svd(local.T @ target)
        local = local @ (u @ vt)
        local *= np.sqrt(np.mean(np.sum(target * target, axis=1))) / max(np.sqrt(np.mean(np.sum(local * local, axis=1))), 1e-8)
        sites[idx] = local + coarse[idx].mean(0)
    return sites


def relax_nodes(sites, embeddings, membership, global_graph):
    """Let equal node charges compete with semantic springs and topic cohesion.

    No force uses polygon area or a target area derived from topic size. The
    local 1/r repulsion accumulates as a topic gains nodes. Semantic springs
    retain close paper groups, instead of relaxing every node to equal spacing.
    """
    topic_indices = [np.flatnonzero(membership == c) for c in range(int(membership.max()) + 1)]
    anchors = np.array([sites[idx].mean(0) for idx in topic_indices])
    reference = sites - anchors[membership]
    weights = np.zeros((len(sites), len(sites)))
    for idx in topic_indices:
        if len(idx) < 2:
            continue
        distances = np.linalg.norm(reference[idx, None, :] - reference[None, idx, :], axis=2)
        np.fill_diagonal(distances, np.inf)
        # Use the same starting neighbor scale, independent of topic count.
        # Sparse UMAP groups can have large gaps. Bound expansion relative to
        # the coarse force layout so a tiny nearest distance cannot inflate one.
        reference[idx] *= min(.3 / max(np.median(distances.min(1)), 1e-8), 1.3)
        squared = np.maximum(2 - 2 * embeddings[idx] @ embeddings[idx].T, 0)
        probabilities = neighbor_probabilities(squared, min(5., (len(idx) - 1) * .6))
        # Probabilities sum to one per topic; n restores a common per-node force.
        weights[np.ix_(idx, idx)] = probabilities * len(idx) * 1.8
    same_topic = membership[:, None] == membership[None, :]
    cross_graph = np.where(same_topic, 0, global_graph)
    # Orient each local projection toward its actual neighbors in other topics.
    # Orthogonal alignment preserves all within-topic distances, including pairs
    # without external edges. It uses no paper IDs or hand-picked directions.
    for _ in range(ORIENTATION_PASSES):
        for c, idx in enumerate(topic_indices):
            if not np.any(cross_graph[idx]):
                continue
            current = reference + anchors[membership]
            targets = cross_graph[idx] @ (current - anchors[c])
            u, _, vt = np.linalg.svd(reference[idx].T @ targets)
            reference[idx] = reference[idx] @ (u @ vt)
    weights += CROSS_TOPIC_STRENGTH * cross_graph
    rest = np.linalg.norm(reference[:, None, :] - reference[None, :, :], axis=2)
    rest = np.where(same_topic, rest, .2)
    sites = reference + anchors[membership]
    velocity = np.zeros_like(sites)
    for iteration in range(FORCE_ITERATIONS):
        centers = np.array([sites[idx].mean(0) for idx in topic_indices])
        delta = sites[:, None, :] - sites[None, :, :]
        distance = np.sqrt(np.sum(delta * delta, axis=2) + 1e-9)
        unit = delta / distance[:, :, None]
        # Stronger short-range separation between topics prevents interleaving.
        magnitude = np.where(same_topic, .006, .035 * np.exp(-distance ** 2 / 6)) / np.maximum(distance, .06)
        np.fill_diagonal(magnitude, 0)
        magnitude -= weights * (distance - rest)
        force = (magnitude[:, :, None] * unit).sum(1)
        local = sites - centers[membership]
        force += -.005 * local + .10 * (reference - local)
        force += .006 * (anchors[membership] - centers[membership])
        force += .4 * (np.maximum(.20 - distance, 0)[:, :, None] * unit).sum(1)
        velocity = .7 * velocity + .22 * force
        sites += .22 * velocity
        if iteration % 500 == 0:
            print(f"Node relaxation {iteration}/{FORCE_ITERATIONS}", flush=True)
    return sites


def canvas_transform(cells):
    vertices = np.array([p for cell in cells for p in cell])
    lower, upper = vertices.min(0), vertices.max(0)
    scale = min((CANVAS - [104, 104]) / (upper - lower))
    shift = CANVAS / 2 - (lower + upper) / 2 * scale
    return scale, shift


def connected_cells(sites, membership, categories):
    """Resolve split topics and marker collisions before making final cells."""
    scales = np.ones(len(categories))
    collision_passes = 0
    for attempt in range(16):
        cells, _, _, _ = preview.coast_cells(sites, clearance_factor=COAST_CLEARANCE_FACTOR)
        regions, _, components, _ = preview.merge_regions(cells, membership)
        fragmented = [c for c, n in components.items() if n != 1 or len(regions[c]) != 1]
        if fragmented:
            print(f"Reconnecting {', '.join(categories[c] for c in fragmented)}", flush=True)
            for c in fragmented:
                indices = membership == c
                center = sites[indices].mean(0)
                sites[indices] = center + (sites[indices] - center) * .9
                scales[c] *= .9
            continue
        scale, _ = canvas_transform(cells)
        distances = np.linalg.norm(sites[:, None, :] - sites[None, :, :], axis=2)
        np.fill_diagonal(distances, np.inf)
        if distances.min() * scale >= MIN_MARKER_SEPARATION:
            return sites, cells, {
                "connectivityScales": {categories[c]: float(scales[c]) for c in range(len(categories)) if scales[c] < 1},
                "collisionPasses": collision_passes,
            }
        # Project overlapping pairs apart, then rebuild ordinary Voronoi cells.
        minimum = (MIN_MARKER_SEPARATION + .15) / scale
        for _ in range(80):
            delta = sites[:, None, :] - sites[None, :, :]
            distance = np.sqrt(np.sum(delta * delta, axis=2) + 1e-12)
            np.fill_diagonal(distance, np.inf)
            overlap = np.maximum(minimum - distance, 0)
            if overlap.max() < 1e-6:
                break
            sites += .5 * (overlap[:, :, None] * delta / distance[:, :, None]).sum(1)
        collision_passes += 1
    raise ValueError("Could not jointly resolve region connectivity and marker spacing.")


def label_slots(regions, categories, labels, membership):
    """Center horizontal bilingual labels without avoiding paper dots."""
    result = {}
    for c, cid in enumerate(categories):
        polygon = np.asarray(regions[c][0])
        next_p = np.roll(polygon, -1, axis=0)
        cross = polygon[:, 0] * next_p[:, 1] - next_p[:, 0] * polygon[:, 1]
        center = ((polygon + next_p) * cross[:, None]).sum(0) / (3 * cross.sum())
        # A concave polygon can have its area centroid outside the region.
        if not preview.point_in_polygon(np.array([center]), polygon)[0]:
            lo, hi = polygon.min(0), polygon.max(0)
            xx, yy = np.meshgrid(np.arange(lo[0], hi[0], 3), np.arange(lo[1], hi[1], 3))
            grid = np.column_stack((xx.ravel(), yy.ravel()))
            grid = grid[preview.point_in_polygon(grid, polygon)]
            center = grid[np.argmin(np.linalg.norm(grid - center, axis=1))]
        slots = {}
        count = int(np.sum(membership == c))
        sizes = (32, 30, 28, 26, 24, 22, 20, 18) if count >= 20 else (26, 24, 22, 20, 18, 16, 14, 12, 10) if count >= 10 else (22, 20, 18, 16, 14, 12, 10)
        for lang in ("en", "zh"):
            name = labels[cid][lang]
            formats = []
            if lang == "en":
                words = name.split()
                wraps = [words] if len(words) == 2 else [[" ".join(words[:2]), words[-1]], [words[0], " ".join(words[1:])], words]
                for size in sizes:
                    formats.extend((size, lines) for lines in [[name], *wraps])
            else:
                split = 4 if len(name) == 6 else 3 if len(name) == 5 else 2
                for size in sizes:
                    formats.extend(((size, [name]), (size, [name[:split], name[split:]])))
            best = None
            for size, lines in formats:
                w = max(preview.text_size(line, size, lang == "zh")[0] for line in lines) + 8
                h = size * 1.12 * len(lines) + 4
                samples = np.array([center + [dx * w, dy * h] for dx in (-.5, 0, .5) for dy in (-.5, 0, .5)])
                outside = samples[~preview.point_in_polygon(samples, polygon)]
                overflow = 0.
                if len(outside):
                    edges = next_p - polygon
                    delta = outside[:, None, :] - polygon[None, :, :]
                    fraction = np.clip(np.sum(delta * edges, axis=2) / np.maximum(np.sum(edges * edges, axis=1), 1e-12), 0, 1)
                    distances = np.linalg.norm(delta - fraction[:, :, None] * edges, axis=2)
                    overflow = float(distances.min(axis=1).sum())
                # Fit the wording at the fixed center, even when it covers dots.
                cost = overflow * 3 + (sizes[0] - size) * 3 + len(lines)
                if best is None or cost < best[0]:
                    best = (cost, {"x": float(center[0]), "y": float(center[1]), "size": size, "lines": lines, "width": w, "height": h, "angle": 0})
            slots[lang] = best[1]
        result[cid] = slots
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "public/source/paper-topic-map.json")
    parser.add_argument("--projection", choices=("umap", "tsne"), default="umap", help="Local projection; t-SNE is retained for controlled comparisons.")
    args = parser.parse_args()
    pubs, embeddings, labels = preview.load_data()
    categories = list(labels)
    membership = np.array([categories.index(p["category"]) for p in pubs])
    print("Computing semantic force layout from cached embeddings", flush=True)
    global_graph = global_neighbor_graph(embeddings)
    sites = semantic_layout(embeddings, membership, categories, args.projection)
    initial_semantics = semantic_metrics(sites, embeddings, membership)
    sites = relax_nodes(sites, embeddings, membership, global_graph)
    sites, cells, constraints = connected_cells(sites, membership, categories)
    scale, shift = canvas_transform(cells)
    width, height = map(int, CANVAS)
    sites = sites * scale + shift
    cells = [[tuple(np.round(np.asarray(p) * scale + shift, 4)) for p in cell] for cell in cells]
    regions, edges, components, _ = preview.merge_regions(cells, membership)
    land, _, _, _ = preview.merge_regions(cells, np.zeros(len(cells), dtype=int))
    assert all(n == 1 for n in components.values())
    assert all(len(rings) == 1 for rings in regions.values()) and len(land[0]) == 1
    for site, cell in zip(sites, cells):
        assert preview.point_in_polygon(np.array([site]), np.asarray(cell))[0], "A paper left its cell."
    slots = label_slots(regions, categories, labels, membership)
    areas = np.array([preview.signed_area(regions[c][0]) for c in range(len(categories))])
    counts = np.bincount(membership)
    cell_areas = np.array([preview.signed_area(cell) for cell in cells])
    maximum_cell_ratio = float(cell_areas.max() / cell_areas.mean())
    final_semantics = semantic_metrics(sites, embeddings, membership)
    assert final_semantics["minimumSeparation"] >= MIN_MARKER_SEPARATION * .999, "Paper markers overlap."
    # Preserve cell subdivisions for an optional detail layer, not graph edges.
    inner_edges = {}
    for cell in cells:
        for a, b in zip(cell, cell[1:] + cell[:1]):
            inner_edges[tuple(sorted((a, b)))] = (a, b)
    for a, b, _ in edges:
        inner_edges.pop(tuple(sorted((a, b))), None)
    data = {
        "version": 1, "width": width, "height": height, "model": preview.MODEL,
        "sourceHash": hashlib.sha256(json.dumps([(p["id"], p["category"], p["title"], p.get("abstract") or "") for p in pubs], ensure_ascii=False, separators=(",", ":")).encode()).hexdigest(),
        "method": f"Within-topic {args.projection.upper()} with global cosine-neighbor orientation and cross-topic semantic springs; equal-charge node repulsion; ordinary Voronoi cells merged by category. No area fitting or polygon deformation.",
        "metrics": {
            "paperCount": len(pubs), "topicCount": len(categories),
            "areaCountCorrelation": float(np.corrcoef(counts, areas)[0, 1]) if np.std(counts) > 0 and np.std(areas) > 0 else None,
            "projection": {"method": args.projection, "seed": 42, **({"nNeighbors": UMAP_NEIGHBORS, "minDist": .1, "epochs": 700} if args.projection == "umap" else {"perplexity": 5, "epochs": 1600})},
            "globalSemanticGraph": {
                "nNeighbors": min(GLOBAL_NEIGHBORS, len(pubs)),
                "crossTopicEdges": int(np.count_nonzero(np.triu((global_graph > 0) & (membership[:, None] != membership[None, :]), 1))),
                "crossTopicStrength": CROSS_TOPIC_STRENGTH,
                "orientationPasses": ORIENTATION_PASSES,
            },
            "forceIterations": FORCE_ITERATIONS,
            "connectedRegions": len(categories),
            "maximumCellAreaRatio": maximum_cell_ratio,
            "coastClearanceFactor": COAST_CLEARANCE_FACTOR,
            **constraints,
            "minimumMarkerSeparation": MIN_MARKER_SEPARATION,
            "semanticBeforeRelaxation": initial_semantics,
            "semanticAfterRelaxation": final_semantics,
        },
        "papers": [{"id": p["id"], "category": p["category"], "x": round(float(xy[0]), 4), "y": round(float(xy[1]), 4), "cell": cells[i]} for i, (p, xy) in enumerate(zip(pubs, sites))],
        "regions": [{"category": cid, "count": int(counts[c]), "area": float(areas[c]), "paperShare": float(counts[c] / len(pubs)), "rings": regions[c], "labels": slots[cid]} for c, cid in enumerate(categories)],
        "coast": land[0][0], "borders": [[a, b] for a, b, coast in edges if not coast],
        "subdivisions": list(inner_edges.values()),
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(json.dumps(data["metrics"], indent=2), flush=True)
    print(f"Saved {args.output}", flush=True)


if __name__ == "__main__":
    main()
