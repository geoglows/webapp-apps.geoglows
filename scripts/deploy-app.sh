#!/usr/bin/env bash

# Build this app and publish it to its own path in the portal.
# Every app and the landing page use this same script; only APP_PATH differs.
# APP_PATH=/rfs-v3 ./scripts/deploy-app.sh

# This script needs the following environment variables:
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY
# S3_BUCKET_NAME
# CLOUDFRONT_DISTRIBUTION_ID
#
# The distribution's origin is the S3 REST endpoint, which serves object keys
# literally — /rfs-v3 is a 404 even though /rfs-v3/index.html exists. A
# CloudFront Function rewrites directory URLs to their index so links stay
# clean; it is attached once by scripts/setup-cloudfront-function.sh and this
# script never touches it.

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

echo "==> publishing to $dest"
aws s3 sync dist/ "$dest" --no-progress --exclude "*.html" --cache-control "public,max-age=3600"
aws s3 sync dist/ "$dest" --no-progress --exclude "*" --include "*.html" --cache-control "no-cache"

# Delete whatever this build no longer produces. Uploads are already done above,
# so this pass only removes. At the site root the app directories sit alongside
# the landing page's own files, so the sweep is narrowed to what the landing
# page owns: "*/*" drops every subdirectory, then "assets/*" adds back its own.
# That pattern is anchored, so it never matches rfs-v3/assets/... .
sweep=(--delete)
[ "$base" = "/" ] && sweep+=(--exclude "*/*" --include "assets/*")

echo "==> sweeping $dest"
aws s3 sync dist/ "$dest" --no-progress "${sweep[@]}"

echo "==> invalidating ${base}*"
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "${base}*" --output text --query 'Invalidation.Id'
