#!/usr/bin/env bash

# Assemble the whole portal into ./_site from local checkouts
#
#   ./scripts/build-local.sh
#   npx serve _site
#
# Pass --analytics to add the Google tag the deploy adds if you plan to deploy this to s3 manually.
# It is off by default so local builds don't pollute analytics

set -euo pipefail
cd "$(dirname "$0")/.."

APPS_DIR="${APPS_DIR:-..}"

analytics=false
for arg in "$@"; do
  case "$arg" in
    --analytics) analytics=true ;;
    *) echo "usage: $0 [--analytics]" >&2; exit 2 ;;
  esac
done

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

# Inject the GA tag if --analytics was given
if [ "$analytics" = true ]; then
  echo "==> injecting analytics"
  read -r -d '' ga_tag <<'HTML' || true
<script async src="https://www.googletagmanager.com/gtag/js?id=G-LLEY2QHRVH"></script>
<script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-LLEY2QHRVH');</script>
HTML
  missing=()
  while IFS= read -r -d '' page; do
    grep -qi '</head>' "$page" || missing+=("${page#_site/}")
  done < <(find _site -name '*.html' -print0)
  if [ ${#missing[@]} -gt 0 ]; then
    echo "!!  no </head> to inject the tag into:" >&2
    printf '!!    %s\n' "${missing[@]}" >&2
    exit 1
  fi

  find _site -name '*.html' -print0 |
    TAG="$ga_tag" xargs -0 perl -0777 -pi -e 's{</head>}{$ENV{TAG}\n</head>}i'
else
  echo "==> analytics not injected (pass --analytics to include it)"
fi

echo ""
echo "==> done — preview with: npx serve _site"
