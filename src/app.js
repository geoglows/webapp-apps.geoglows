// The only entry point. All three pages load this file.
//
// Page content is static markup in index.html / profile.html / terms.html.
// The two things that can't be static are the theme toggle and anything
// touching a session, and the latter lives entirely in ./auth.js.

import { inject } from "@vercel/analytics";

// The `dark` class is applied by a blocking inline script in each page's
// <head>, before first paint. Both sun and moon icons are in the markup and
// swapped by CSS, so all that's left is the click.
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

inject();
