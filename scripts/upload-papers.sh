#!/usr/bin/env bash
#
# Upload paper PDFs to a Cloudflare R2 bucket. Object keys mirror the local
# layout under public/source/ (e.g. "projects/trajgram/trajgram.pdf"), which is
# exactly what src/data.ts paperUrl() expects when VITE_PAPERS_BASE is set.
#
# Resumable: skips objects already present (checked via the public r2.dev URL),
# and retries each upload a few times to ride out transient network errors.
#
# Requires wrangler to be authenticated — either `wrangler login` (OAuth) or a
# CLOUDFLARE_API_TOKEN with "Workers R2 Storage: Edit". Set CLOUDFLARE_ACCOUNT_ID
# if your login covers multiple accounts. Set PAPERS_PUBLIC_BASE to the bucket's
# public r2.dev origin to enable skip-if-present.
#
# Usage: scripts/upload-papers.sh [bucket-name]
#
set -uo pipefail

BUCKET="${1:-zjuidg-papers}"
ROOT="public/source"
PUBLIC_BASE="${PAPERS_PUBLIC_BASE:-}"
RETRIES=4

count=0
uploaded=0
skipped=0
failed=0
total=$(find "$ROOT" -type f \( -iname '*.pdf' \) | wc -l | tr -d ' ')
echo "Uploading $total PDFs to r2://$BUCKET ..."

while IFS= read -r -d '' f; do
  key="${f#"$ROOT"/}"
  count=$((count + 1))

  if [[ -n "$PUBLIC_BASE" ]] && curl -sf -I "$PUBLIC_BASE/$key" >/dev/null 2>&1; then
    printf '[%3d/%3d] skip (exists) %s\n' "$count" "$total" "$key"
    skipped=$((skipped + 1))
    continue
  fi

  ok=0
  for attempt in $(seq 1 "$RETRIES"); do
    if npx wrangler r2 object put "$BUCKET/$key" \
        --file "$f" --content-type application/pdf --remote >/dev/null 2>&1; then
      ok=1
      break
    fi
    printf '    retry %d/%d for %s\n' "$attempt" "$RETRIES" "$key"
    sleep $((attempt * 2))
  done

  if [[ "$ok" -eq 1 ]]; then
    printf '[%3d/%3d] ok   %s\n' "$count" "$total" "$key"
    uploaded=$((uploaded + 1))
  else
    printf '[%3d/%3d] FAIL %s\n' "$count" "$total" "$key"
    failed=$((failed + 1))
  fi
done < <(find "$ROOT" -type f \( -iname '*.pdf' \) -print0)

echo "Done. uploaded=$uploaded skipped=$skipped failed=$failed total=$total"
[[ "$failed" -eq 0 ]]
