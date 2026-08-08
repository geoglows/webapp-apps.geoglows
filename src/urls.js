// The portal is served straight off a CDN origin (S3 behind CloudFront), which
// returns objects literally — a directory URL like /rfs-v3 is a 404, not its
// index. So every internal link spells the file out: /rfs-v3/index.html for an
// app directory, /profile.html for a page. Explicit links also work on hosts
// that would have rewritten the directory URL, so this is unconditional.
export function htmlHref(path, { page = false } = {}) {
  if (/\.html$/.test(path)) return path;
  const clean = path.replace(/\/+$/, "");
  return page ? `${clean}.html` : `${clean}/index.html`;
}