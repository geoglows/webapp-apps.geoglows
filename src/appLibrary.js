import config from "../apps.json";

const ICONS = {
  waves: `<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>`,
  droplet: `<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>`,
  siren: `<path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"/><path d="M21 12h1"/><path d="M18.5 4.5 18 5"/><path d="M2 12h1"/><path d="M12 2v1"/><path d="m4.929 4.929.707.707"/><path d="M12 12v6"/>`,
  gauge: `<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>`,
  "clipboard-check": `<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>`,
  "scan-gravity": `<path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/>`,
  boxes: `<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>`,
};

// Full literal class strings so Tailwind's scanner picks them up. Each accent
// colors both the icon stroke and its tinted chip background.
const ACCENTS = {
  blue: "text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20",
  cyan: "text-cyan-500 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/10 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-500/20",
  indigo: "text-indigo-500 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/10 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/20",
  sky: "text-sky-500 dark:text-sky-400 bg-sky-100 dark:bg-sky-500/10 group-hover:bg-sky-200 dark:group-hover:bg-sky-500/20",
  teal: "text-teal-500 dark:text-teal-400 bg-teal-100 dark:bg-teal-500/10 group-hover:bg-teal-200 dark:group-hover:bg-teal-500/20",
  emerald: "text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/20",
  amber: "text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 group-hover:bg-amber-200 dark:group-hover:bg-amber-500/20",
  violet: "text-violet-500 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/10 group-hover:bg-violet-200 dark:group-hover:bg-violet-500/20",
};

const FALLBACK_ICON = "waves";
const FALLBACK_ACCENT = "blue";

// First-party data, but interpolated text is still escaped so a stray < or &
// in a name/description/tag can't break the markup.
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function tagPill(text) {
  return `<span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-slate-300 border border-blue-200 dark:border-slate-700">${esc(text)}</span>`;
}

// One app card — the original card markup, with href/icon/accent/name/
// description/tags pulled from config.
function appCard(app) {
  const icon = ICONS[app.icon] ?? ICONS[FALLBACK_ICON];
  const accent = ACCENTS[app.accent] ?? ACCENTS[FALLBACK_ACCENT];
  const tags = (app.tags ?? []).map(tagPill).join("");
  return `
      <a href="${esc(app.path)}" class="glass-card p-8 rounded-2xl flex flex-col h-full group relative overflow-hidden">
        <div class="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-blue-500" aria-hidden="true">
            <path d="M7 7h10v10"/>
            <path d="M7 17 17 7"/>
          </svg>
        </div>
        <div class="mb-6 p-3 rounded-xl w-fit transition-colors ${accent}">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>
        </div>
        <h3 class="text-2xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${esc(app.name)}</h3>
        <p class="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 grow">${esc(app.description)}</p>
        <div class="flex flex-wrap gap-2 mt-auto">${tags}</div>
      </a>`;
}

// One group: an optional heading, then a grid of its app cards. A blank
// heading renders a plain grid (no <h2>), matching the old single-grid look.
function groupSection(group) {
  const heading = group.heading
    ? `<h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-6">${esc(group.heading)}</h2>`
    : "";
  const cards = (group.apps ?? []).map(appCard).join("");
  return `
    <section class="mb-16 last:mb-0">
      ${heading}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">${cards}
      </div>
    </section>`;
}

export function renderAppLibrary(mount = document.getElementById("appLibrary")) {
  if (!mount) return; // no-op on pages without the grid (profile / terms)
  mount.innerHTML = (config.groups ?? []).map(groupSection).join("");
}
