// The only entry point. All three pages load this file.
//
// Page content is static markup in index.html / profile.html / terms.html.
// The two things that can't be static are the theme toggle and anything
// touching a session, and the latter lives entirely in ./auth.js.

import { hydrateIcons } from "./icons.js";

// Fill in every [data-icon] slot in the static markup. Icons live in one place
// (src/icons.js, sourced from heroicons) rather than as path data pasted into
// each page.
hydrateIcons();

// The `dark` class is applied by a blocking inline script in each page's
// <head>, before first paint. Both sun and moon icon slots are in the markup
// and swapped by CSS, so all that's left is the click.
document.getElementById("theme-toggle")?.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  } catch {
    // Private mode — the toggle still works for this page view.
  }
});

// Supabase is ~210 kB, by far the heaviest thing on the site. Load it only on
// the pages that have an auth control, so /terms never pays for it.
if (document.getElementById("authActionSlot")) {
  import("./auth.js").then((auth) => auth.start());
}

// The home page's app library is generated from apps.json. Load the
// renderer (and its bundled config) only on the page that has the grid.
if (document.getElementById("appLibrary")) {
  import("./appLibrary.js").then((m) => m.renderAppLibrary());
}
