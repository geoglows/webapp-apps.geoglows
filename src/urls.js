const EXPLICIT = ["1", "true"].includes(
  String(import.meta.env.VITE_EXPLICIT_HTML ?? "").toLowerCase(),
);

export function explicitHtml(path, { page = false } = {}) {
  if (!EXPLICIT || /\.html$/.test(path)) return path;
  const clean = path.replace(/\/+$/, "");
  return page ? `${clean}.html` : `${clean}/index.html`;
}
