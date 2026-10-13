# CLAUDE.md

Read and follow [AGENTS.md](AGENTS.md) for repository instructions, including the
complete publication insertion workflow. It is the shared source of maintenance
instructions for this project.

For publication work, follow the steps under "Adding a publication" in order:
assets and metadata, one primary category with a coding record, UMAP topic-map
regeneration, validation and browser review, then commit. The homepage reads
`public/source/paper-topic-map.json` in About Us.

See [the category codebook](docs/publication-categories.md) for classification
boundaries and [the map notes](docs/paper-topic-map.md) for layout details.
Deployment follows `.github/workflows/deploy.yml`; commit-only requests stop
before pushing.
