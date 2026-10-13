# Homepage topic map

The About Us section embeds the paper map below its introduction, replacing
the former three research-topic cards. There is no separate paper-map section
or navigation entry. The `#map` anchor remains on the embedded widget for links.

The homepage reads `public/source/paper-topic-map.json`. Each paper has one
research category from `publications.json`; display names follow the category
codebook and the English/Chinese copy in `src/i18n.ts`.
The current 203 papers use 15 categories. Human-AI collaboration is treated as a
cross-topic method, with its former papers classified by their main contribution.
Model Mechanisms contains nine papers on internal model analysis, knowledge
editing, security, and language reasoning. TMoE, FEA-SLT, and ProTAL are classified
under time series, multimodal analysis, and data wrangling respectively.
Table Illustrator belongs to Data Wrangling under the confirmed table-construction
interpretation: Data Wrangling has 24 papers and Visualization Design has 31.

## Layout and area

1. Title and abstract embeddings come from the existing local cache, using
   `text-embedding-3-small`. The generator verifies every content hash.
2. A force layout uses cosine neighbors and weak semantic topic anchors for the
   coarse arrangement. The default local projection is UMAP, using exact cosine
   neighbors, `nNeighbors=4` (capped below the topic count), `minDist=0.1`, 700
   epochs, and seed 42. `umap-js` runs through `project-topic-umap.mjs`; topics with
   at most two papers use MDS. Self-distances are explicitly zero, since floating
   point residue can change UMAP's nearest-positive-distance calculation.
3. Local coordinates aim for a median nearest-neighbor distance of 0.3, with
   expansion limited to 1.3 times the coarse force layout's scale. This keeps a
   sparse UMAP group from becoming oversized just because two nodes nearly
   coincide. A global fuzzy neighbor graph uses 12 cosine KNN entries per paper,
   including self. Twenty orthogonal-alignment passes orient each local group
   toward its neighbors in other topics while preserving local pair distances.
   The final 2,200-step relaxation retains these cross-topic springs with strength
   0.02, alongside local semantic springs, equal-charge 1/r repulsion, weak topic
   cohesion, and attraction to the oriented reference. It contains 860 undirected
   cross-topic edges for the current collection. No individual paper has a manual
   position override. More nodes create more repulsion, so larger topics tend to
   occupy more space. No polygon area or target area derived from counts enters
   the force calculation.
4. Ordinary Euclidean Voronoi cells are generated from the final node positions
   and merged by category. Auxiliary exterior points trim the coast. Their
   clearance is 0.75 times the longest edge in the nodes' Euclidean minimum
   spanning tree, with a floor of 1 in layout units. This keeps the coast
   connected with the revised node arrangement. Flood filling keeps
   exterior seeds out of enclosed inland gaps. Shared cell edges are stored once.
5. If a category splits, a uniform contraction reconnects its nodes. Marker
   collisions are resolved by separating overlapping pairs, rebuilding Voronoi
   cells, and checking connectivity again. Marker centers stay at least 9 SVG
   units apart on the 1,100 × 800 canvas. The current collection requires one
   collision pass and no category contraction. There is no polygon deformation,
   per-cell area cap, or boundary compactness fitting.
6. Bilingual labels stay horizontal at each region's area centroid, with an
   interior fallback for concave regions. Font size and wrapping fit the region
   without avoiding paper dots. Labels use 60% opacity and are behind the dots.

Area roughly reflects paper count. It also depends on semantic arrangement,
neighboring topics, and the coastline; it is not an exact count encoding. For
example, sports has 40 of the 203 papers (19.7%) and occupies 12.6% of the land.
Tooltip percentages refer to paper counts, stored as `paperShare`, not area.

Positions express approximate semantic proximity. Neither distance nor adjacency
represents a causal effect. The within-topic refinement uses
[UMAP](https://umap-learn.readthedocs.io/en/latest/parameters.html). It does not
preserve original-space density: visible gaps show layout structure, not measured
differences in research diversity.

## Semantic and geometry checks

The 2026-10-13 controlled comparison uses the same 203 papers, with Table
Illustrator in Data Wrangling, and identical global graph, orientation, force,
and boundary settings. Only the local projection changes. Neighbor recall is
the fraction of embedding neighbors also found among nearest displayed points,
averaged over papers. Within-topic and cross-topic recall restrict both searches
to the same category or to other categories respectively. Small categories use
all available neighbors when fewer than k exist.

| Local projection | Global top-3 | Within-topic top-3 | Within-topic top-5 | Cross-topic top-3 |
| --- | ---: | ---: | ---: | ---: |
| t-SNE | 45.5% | 63.1% | 65.4% | 3.6% |
| UMAP (homepage) | 42.0% | 60.4% | 66.0% | 6.7% |

UMAP improves the comparison among external-topic neighbors, but not every
metric. The fraction of cross-topic members of the original global top eight
also retained in the displayed global top eight is 1.9% for t-SNE and 1.4% for
UMAP. Contiguous single-category regions still separate many cross-topic
neighbors. These scores measure agreement with embeddings, not independent
judgments of paper relevance.

Compared with the previous homepage, GeoAnimation's displayed neighbor ranks
for GeoChron and GeoNetverse change from 66/74 to 41/36. GeoAuthor and Trajgram
remain its closest two papers. In the controlled t-SNE comparison, the ranks
are 53/61. The orientation and cross-topic springs apply to all papers, rather
than assigning a special location to GeoAnimation.

The UMAP layout has 15 connected regions and minimum marker separation of 9.150
SVG units. The Pearson correlation between topic counts and region areas is
0.950. These area statistics are diagnostics, not fitting objectives. Projection
settings, global graph settings, and semantic recall before and after relaxation
are recorded in the output JSON.

## Appearance and interaction

The visual reference is Fig. 5A and Section 5.1 of
[CausalMap](https://doi.org/10.1109/TVCG.2025.3633839), also visible in the
repository's `public/source/projects/CausalMap/CausalMap.jpg` teaser. The map uses
bright macaron pastel land, soft slate-gray boundaries and paper markers, faint
dashed subdivisions, and direct topic labels. Color encodes research categories
here. The surrounding UI follows the selected dark or light theme; category
colors stay the same in both themes. Selected markers and region borders use a
deeper slate gray for contrast.
There is no time axis, causal pathway encoding, or paper-to-paper edge.

Each paper's Voronoi cell is its pointer target for a paper tooltip and marker
highlight. Hovering or focusing a cell adds a subtle white background at 18%
opacity. The cell layer sits below borders, labels, and dots and follows the
same zoom and pan transform. Clicking anywhere in the cell finds its paper
below. Cells also support keyboard focus and Enter/Space activation. Topic
selection and details remain available through the legend. There is no fixed
detail bar below the map.
The map uses custom tooltips and accessible names, without browser-native title
tooltips. Region labels are drawn beneath paper dots, so labels cannot cover them.
The map supports keyboard selection, zoom,
dragging after zoom, and a reset button. Paper cell subdivisions are always
visible. The toolbar contains the paper/topic counts and zoom controls.

## Regeneration

```sh
node scripts/compute-paper-map.mjs --embeddings-only
python3 -B scripts/compute-topic-map.py
node scripts/validate-topic-map.mjs
pnpm build
```

The Python step requires NumPy and Pillow, and invokes Node with the existing
`umap-js` dependency. For a controlled t-SNE comparison, run
`python3 -B scripts/compute-topic-map.py --projection tsne --output /tmp/topic-map-tsne.json`. No API request is made when all title
and abstract embeddings are cached. The API key is required only for missing
embeddings. The resulting JSON is committed and served directly.

The validator checks source freshness, one node per publication, category counts,
paper containment, label anchors, marker spacing, coverage, and sampled gaps or
overlaps. It also verifies that cell vertices are no closer to another paper,
which checks that the output remains an ordinary Voronoi partition after rounding.
The generator additionally verifies shared-edge connectivity. Region area and
maximum cell size are descriptive metrics; they have no required target values.

The original ungrouped UMAP layout remains in `paper-map.json` as a previous version and
is not loaded by the homepage.
