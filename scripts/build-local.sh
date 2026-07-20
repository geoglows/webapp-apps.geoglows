#!/usr/bin/env bash
#
# build-local.sh — assemble the apps.geoglows site into ./_site from your LOCAL
# checkouts of each app, so you can preview uncommitted / staged changes.
#
# Unlike the GitHub Pages workflow (.github/workflows/deploy.yml), this does NOT
# clone anything. It builds whatever you already have checked out next to this
# repo. The build + assemble logic mirrors the workflow; only the source of each
# app differs (your working copy here vs. a fresh clone in CI).
#
# With no arguments it does a full build: rebuilds the index (landing page) and
# every app into a fresh ./_site. Pass one or more app selectors to rebuild ONLY
# those apps in place, leaving the index and the other apps in ./_site untouched
# — the fast path when you changed a single app. A selector is an app's URL path
# (with or without the leading slash, e.g. /rfs or rfs) or its repo basename
# (e.g. rfs-v2-hydroviewer).
#
# Where it looks for each app (first match wins):
#   1. the app's "localPath" in apps.json, if set
#      (absolute, or relative to this repo)
#   2. $APPS_DIR/<repo-basename>, where APPS_DIR defaults to the parent dir ("..")
# Apps with no local checkout are skipped with a warning (the rest still build).
#
# Per-app fields read from apps.json:
#   repository (required)  owner/repo; its basename is the default local dir name
#   path       (required)  URL path the app is served at, also its build base (e.g. /rfs)
#   localPath  (optional)  explicit local checkout dir (absolute or relative to repo root)
#   install    (optional)  install command; only run when node_modules is absent
#   build      (optional)  build command; $BASE (e.g. /rfs) is exported
#                          (default: npx vite build --base="$BASE/")
#   dist       (optional)  output dir to copy from (default: dist)
#
# Builds run in place in each app's working directory, so its own dist/ (a build
# artifact) is overwritten. node_modules is reused as-is; nothing is installed
# unless it is missing.
#
# Usage:
#   ./scripts/build-local.sh                      # full site (index + all apps)
#   ./scripts/build-local.sh rfs                  # rebuild only /rfs
#   ./scripts/build-local.sh rfs hydrosos         # rebuild only these apps
#   npm run build:site -- rfs                     # same, via npm (note the --)
#   APPS_DIR=~/code/geoglows ./scripts/build-local.sh
#   npx serve _site                               # preview the assembled site

set -euo pipefail

# Run from the repo root regardless of where the script is invoked from.
cd "$(dirname "$0")/.."
REPO_ROOT="$PWD"

command -v jq >/dev/null || { echo "error: jq is required (brew install jq)" >&2; exit 1; }

APPS_DIR="${APPS_DIR:-..}"
CONFIG="apps.json"

# Any arguments are app selectors; none means "build the whole site".
TARGETS=("$@")
targeted=0
[ ${#TARGETS[@]} -gt 0 ] && targeted=1

# Does this app match one of the requested selectors? $1=path-slug $2=repo-basename
app_targeted() {
  local slug="$1" repobase="$2" t
  for t in "${TARGETS[@]}"; do
    t="${t#/}"
    if [ "$t" = "$slug" ] || [ "$t" = "$repobase" ]; then return 0; fi
  done
  return 1
}

if [ "$targeted" -eq 0 ]; then
  echo "==> cleaning _site/"
  rm -rf _site

  echo "==> building index (landing page)"
  [ -d node_modules ] || npm install
  npm run build

  mkdir -p _site
  cp -r dist/. _site/
  touch _site/.nojekyll
else
  echo "==> targeted build (index and other apps in _site/ left as-is): ${TARGETS[*]}"
  [ -d _site ] || echo "!!  _site/ doesn't exist yet — run with no arguments once to build the full site first"
fi

missing=()

while IFS= read -r app; do
  repo=$(printf '%s' "$app" | jq -r '.repository')
  path=$(printf '%s' "$app" | jq -r '.path')
  localPath=$(printf '%s' "$app" | jq -r '.localPath // empty')
  install=$(printf '%s' "$app" | jq -r '.install // empty')
  build=$(printf '%s' "$app" | jq -r '.build // empty')
  dist=$(printf '%s' "$app" | jq -r '.dist // "dist"')

  base="/${path#/}"          # normalise to one leading slash: /rfs
  slug="${path#/}"           # rfs
  repobase="${repo##*/}"     # rfs-v2-hydroviewer
  dest="_site${base}"        # _site/rfs

  # In targeted mode, build only the apps whose selector was passed.
  if [ "$targeted" -eq 1 ] && ! app_targeted "$slug" "$repobase"; then
    continue
  fi

  # Resolve the local checkout for this app.
  if [ -n "$localPath" ]; then
    case "$localPath" in
      /*) dir="$localPath" ;;
      *)  dir="$REPO_ROOT/$localPath" ;;
    esac
  else
    dir="$APPS_DIR/${repobase}"
  fi

  if [ ! -d "$dir" ]; then
    echo "!!  skip ${base}/ — no local checkout at ${dir}"
    missing+=("${repo}  (looked in ${dir})")
    continue
  fi

  echo "==> ${base}/  <-  ${dir}"
  (
    cd "$dir"
    export BASE="$base"
    if [ ! -d node_modules ]; then
      echo "    installing deps (no node_modules)"
      if [ -n "$install" ]; then eval "$install"; else npm install; fi
    fi
    if [ -n "$build" ]; then eval "$build"
    else npx vite build --base="$BASE/"; fi
  )

  rm -rf "$dest"
  mkdir -p "$dest"
  cp -r "$dir/$dist/." "$dest/"
done < <(jq -c '.groups[].apps[] | select((.repository // "") != "")' "$CONFIG")

# Flag any selector that matched no app in the config (likely a typo).
if [ "$targeted" -eq 1 ]; then
  known=$(jq -r '.groups[].apps[] | select((.repository // "") != "") | (.path | ltrimstr("/")), (.repository | split("/") | last)' "$CONFIG")
  for t in "${TARGETS[@]}"; do
    if ! printf '%s\n' "$known" | grep -qxF -- "${t#/}"; then
      echo "!!  unknown app selector: ${t}"
    fi
  done
fi

echo ""
echo "==> done. Site assembled in ./_site"
if [ ${#missing[@]} -gt 0 ]; then
  echo ""
  echo "    skipped ${#missing[@]} app(s) with no local checkout:"
  for m in "${missing[@]}"; do echo "      - ${m}"; done
  echo "    clone them next to this repo, set APPS_DIR, or add a \"localPath\" in apps.config.json."
fi
echo ""
echo "    preview with:  npx serve _site   (or any static file server)"
