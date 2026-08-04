#!/bin/zsh
cd /Users/rchales/code/apps-portal/apps.geoglows/
PORTAL_BASE=/portal EXPLICIT_HTML=1 npm run build:site
s5cmd sync --delete --exclude "*/.DS_Store" --exclude ".DS_Store" _site/portal/ s3://rfs-v3-app-demonstration-401506828094-us-east-1-an/portal/
aws cloudfront create-invalidation --distribution-id E1N1QIHIZO12BU --paths "/portal/*"
