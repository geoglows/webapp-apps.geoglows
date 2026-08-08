#!/usr/bin/env bash
#
# Assemble the whole portal into ./_site from local checkouts, to see it as one
# site before anything deploys. Nothing here deploys, and nothing is cloned —
# each app is built where it already sits, next to this repo.
#
#   ./scripts/build-local.sh
#   npx serve _site
#
# Apps are looked for at $APPS_DIR/<repo-name>, with APPS_DIR defaulting to the
# parent directory. Any app without a checkout is skipped.

set -euo pipefail
cd "$(dirname "$0")/.."

APPS_DIR="${APPS_DIR:-..}"

echo "==> landing page"
rm -rf _site
npm run build
mkdir -p _site
cp -r dist/. _site/

while read -r slug repo; do
  dir="${APPS_DIR}/${repo}"
  if [ ! -d "$dir" ]; then
    echo "!!  skip /${slug} — no checkout at ${dir}"
    continue
  fi
  echo "==> /${slug}  <-  ${dir}"
  if ! (cd "$dir" && npx vite build --base="/${slug}/"); then
    echo "!!  /${slug} failed to build — skipping"
    continue
  fi
  rm -rf "_site/${slug}"
  mkdir -p "_site/${slug}"
  cp -r "$dir/dist/." "_site/${slug}/"
done < <(jq -r '.groups[].apps[] | select(.repository) | "\(.path | ltrimstr("/")) \(.repository | split("/") | last)"' apps.json)

echo ""
echo "==> done — preview with: npx serve _site"
