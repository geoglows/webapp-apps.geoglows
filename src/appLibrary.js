import config from "../apps.json";
import { heroicon, iconSvg, register } from "./icons.js";
import { explicitHtml } from "./urls.js";

import arrowUpRight from "heroicons/24/outline/arrow-up-right.svg?raw";
import bellAlert from "heroicons/24/outline/bell-alert.svg?raw";
import chartBarSquare from "heroicons/24/outline/chart-bar-square.svg?raw";
import globeEuropeAfrica from "heroicons/24/outline/globe-europe-africa.svg?raw";
import map from "heroicons/24/outline/map.svg?raw";
import scale from "heroicons/24/outline/scale.svg?raw";
import square3Stack3d from "heroicons/24/outline/square-3-stack-3d.svg?raw";

// The icons an app can name in apps.json, plus the card's hover arrow. They
// live here rather than in ./icons.js so they ship in this chunk, which only
// the home page loads.
register({
  "heroicon:arrow-up-right": heroicon(arrowUpRight),
  "heroicon:bell-alert": heroicon(bellAlert),
  "heroicon:chart-bar-square": heroicon(chartBarSquare),
  "heroicon:globe-europe-africa": heroicon(globeEuropeAfrica),
  "heroicon:map": heroicon(map),
  "heroicon:scale": heroicon(scale),
  "heroicon:square-3-stack-3d": heroicon(square3Stack3d),
});

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

const FALLBACK_ACCENT = "blue";

// Each app deploys itself to its own path at the site root, so an app's
// apps.json path (/rfs-v3) is already its URL. VITE_EXPLICIT_HTML spells out
// the index.html for hosts (a bare CDN origin) that don't resolve a directory
// URL to its index — see explicitHtml in src/urls.js.
const appHref = (path) =>
  explicitHtml(`/${String(path ?? "").replace(/^\/+/, "")}`);

function tagPill(text) {
  return `<span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-slate-300 border border-blue-200 dark:border-slate-700">${text}</span>`;
}

// One app card — the original card markup, with href/icon/accent/name/
// description/tags pulled from config.
function appCard(app) {
  const accent = ACCENTS[app.accent] ?? ACCENTS[FALLBACK_ACCENT];
  const tags = (app.tags ?? []).map(tagPill).join("");
  return `
      <a href="${appHref(app.path)}" class="glass-card p-8 rounded-2xl flex flex-col h-full group relative overflow-hidden">
        <div class="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
          ${iconSvg("heroicon:arrow-up-right", { size: 24, className: "w-6 h-6 text-blue-500" })}
        </div>
        <div class="mb-6 p-3 rounded-xl w-fit transition-colors ${accent}">
          ${iconSvg(app.icon, { size: 32 })}
        </div>
        <h3 class="text-2xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${app.name}</h3>
        <p class="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 grow">${app.description}</p>
        <div class="flex flex-wrap gap-2 mt-auto">${tags}</div>
      </a>`;
}

// One group: an optional heading, then a grid of its app cards. A blank
// heading renders a plain grid (no <h2>), matching the old single-grid look.
function groupSection(group) {
  const heading = group.heading
    ? `<h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-6">${group.heading}</h2>`
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
