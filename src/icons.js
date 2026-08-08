import moon from "heroicons/24/outline/moon.svg?raw";
import sun from "heroicons/24/outline/sun.svg?raw";
import userCircle from "heroicons/24/outline/user-circle.svg?raw";
import globeEuropeAfrica from "heroicons/24/outline/globe-europe-africa.svg?raw";

export const heroicon = (raw) => (attrs) => raw.replace(/^<svg/, `<svg ${attrs}`);

const ICONS = {};

export function register(icons) {
  Object.assign(ICONS, icons);
}

register({
  "heroicon:moon": heroicon(moon),
  "heroicon:sun": heroicon(sun),
  "heroicon:user-circle": heroicon(userCircle),
  "heroicon:globe-europe-africa": heroicon(globeEuropeAfrica),
});

const FALLBACK = "heroicon:globe-europe-africa";

export function iconSvg(name, {size = 24} = {}) {
  const render = ICONS[name] ?? ICONS[FALLBACK];
  return render ? render(`width="${size}" height="${size}" aria-hidden="true"`) : "";
}

export function hydrateIcons(root = document) {
  for (const el of root.querySelectorAll("[data-icon]")) {
    el.innerHTML = iconSvg(el.dataset.icon, {size: Number(el.dataset.iconSize) || 24});
  }
}
