import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
import tailwindcss from '@tailwindcss/vite';

const entry = (path) => fileURLToPath(new URL(path, import.meta.url));

// The distribution rewrites an extensionless request to <path>/index.html. Neither the dev server
// nor `vite preview` does: with the default `spa` appType they hand /licenses to the root
// index.html, so every clean URL rendered the portal home page instead of the page asked for.
// This applies the same rewrite locally, from whichever directory that server is serving, so a
// link that works on the CDN works here too. Registering the middleware inside configureServer
// (rather than returning a post hook) puts it ahead of Vite's own html fallback, which is the one
// doing the swallowing.
const cleanUrls = () => {
  // dev serves the source tree, preview serves the build, and each has to look for the page where
  // its own server would find it.
  const rewrite = (dir) => (req, res, next) => {
    const [pathname, search] = req.url.split('?');
    const page = `${pathname.replace(/\/$/, '')}/index.html`;
    if (!pathname.includes('.') && existsSync(entry(`./${dir}${page}`))) {
      req.url = search ? `${page}?${search}` : page;
    }
    next();
  };
  return {
    name: 'clean-urls',
    configureServer: (server) => void server.middlewares.use(rewrite('.')),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite('dist'))
  };
};

export default defineConfig({
  plugins: [tailwindcss(), cleanUrls()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: ['es2020', 'safari14'],
    rollupOptions: {
      // Each page is its own directory so it builds to <name>/index.html and
      // is served at a clean, extensionless URL (/profile). The distribution
      // rewrites an extensionless request to <path>/index.html, so a page
      // published as profile.html would not be reachable at /profile.
      input: {
        main: entry('./index.html'),
        profile: entry('./profile/index.html'),
        terms: entry('./terms/index.html'),
        licenses: entry('./licenses/index.html')
      }
    }
  }
});
