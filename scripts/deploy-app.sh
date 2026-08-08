#!/usr/bin/env bash

# Build this app and publish it to its own path in the portal.
# Every app and the landing page use this same script; only APP_PATH differs.
# APP_PATH=/rfs-v3 ./scripts/deploy-app.sh

# This script needs the following environment variables:
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY
# S3_BUCKET_NAME
# CLOUDFRONT_DISTRIBUTION_ID

set -euo pipefail

# ensure variables are set or give an error message
: "${APP_PATH:?set APP_PATH, e.g. /rfs-v3 (or / for the landing page)}"
: "${S3_BUCKET_NAME:?set S3_BUCKET_NAME, e.g. apps-geoglows}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?set CLOUDFRONT_DISTRIBUTION_ID}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

base="/${APP_PATH#/}"; base="${base%/}/"     # /rfs-v3/, or /
dest="s3://${S3_BUCKET_NAME}${base}"

echo "==> building $base"
npx vite build --base="$base"

# Google tag, added by the deployment builder rather than to each app's code
echo "==> injecting analytics"
read -r -d '' ga_tag <<'HTML' || true
<script async src="https://www.googletagmanager.com/gtag/js?id=G-LLEY2QHRVH"></script>
<script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-LLEY2QHRVH');</script>
HTML

# Make sure every page as a </head> to find and inject the tag
missing=()
while IFS= read -r -d '' page; do
  grep -qi '</head>' "$page" || missing+=("$page")
done < <(find dist -name '*.html' -print0)
if [ ${#missing[@]} -gt 0 ]; then
  echo "!!  no </head> to inject the tag into:" >&2
  printf '!!    %s\n' "${missing[@]}" >&2
  exit 1
fi

find dist -name '*.html' -print0 | TAG="$ga_tag" xargs -0 perl -0777 -pi -e 's{</head>}{$ENV{TAG}\n</head>}i'

echo "==> publishing to $dest"
aws s3 sync dist/ "$dest" --no-progress --exclude "*.html" --cache-control "public,max-age=3600"
aws s3 sync dist/ "$dest" --no-progress --exclude "*" --include "*.html" --cache-control "no-cache"

sweep=(--delete)
if [ "$base" = "/" ]; then
  sweep+=(--exclude "*/*")
  for d in dist/*/; do
    [ -d "$d" ] || continue                  # no match: the glob stayed literal
    sweep+=(--include "$(basename "$d")/*")
  done
fi

echo "==> sweeping $dest"
aws s3 sync dist/ "$dest" --no-progress "${sweep[@]}"

echo "==> invalidating ${base}*"
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "${base}*" --output text --query 'Invalidation.Id'
