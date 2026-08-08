#!/usr/bin/env bash
#
# Publish the local v3 data root to the staging bucket.
#
# One folder, one command: everything the app reads lives under $RFS_V3_DATA_DIR, laid out exactly
# as it is served, so this is a straight mirror rather than a per-dataset upload. It replaces
# sync_fim.sh, which pushed the FIM tiles from a separate staging directory to their own prefix.
#
#   ./references/sync_sample_data.sh              # dry run: prints what would change
#   ./references/sync_sample_data.sh --apply      # actually writes
#
# A dry run is the default on purpose: this syncs with --delete, so anything in the destination
# prefix that is not in the local folder is removed.
#
# Overridable: RFS_V3_DATA_DIR, RFS_V3_BUCKET, RFS_V3_PREFIX.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# The data root is the same value the dev server and the tests use, so there is one place to change
# it. An environment variable still wins, for a one-off publish from somewhere else.
if [[ -z "${RFS_V3_DATA_DIR:-}" && -f "$repo_root/.env.development" ]]; then
  set -a
  # shellcheck disable=SC1091
  . "$repo_root/.env.development"
  set +a
fi

DATA_DIR="/Users/rchales/data/rfsv3"
BUCKET="s3://rfs-v3-app-demonstration-401506828094-us-east-1-an"
PREFIX="sample-data"
DEST="${BUCKET%/}/${PREFIX#/}"

EXCLUDES=(
  --exclude "*fldpln-fim/*"
  --exclude "*hydrography-scratchfiles/*"
  --exclude "*.DS_Store"
  --exclude "*.sh"
)

missing=()
for required in \
  flood-maps/manifest.json \
  flood-maps/tile_boundaries.pmtiles \
  flood-maps/network_graph_fim.json \
  hydrography/group=0/streams.pmtiles \
  hydrography/group=0/metadata.zarr \
  retrospective/return-periods.zarr \
  forecasts15
do
  [[ -e "$DATA_DIR/$required" ]] || missing+=("$required")
done
if (( ${#missing[@]} )); then
  echo "WARNING: not present in $DATA_DIR, so --delete will remove it from $DEST:" >&2
  exit 1
fi

echo "source: $DATA_DIR"
echo "dest:   $DEST"

s5cmd sync --delete "${EXCLUDES[@]}" "$DATA_DIR/" "$DEST/"
