import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const entry = (path) => fileURLToPath(new URL(path, import.meta.url));

// Prefix the whole portal (landing page + every app) with a sub-path, e.g.
// PORTAL_BASE=/portal serves the index at /portal/ and /rfs-v3 at
// /portal/rfs-v3/. Unset (the GitHub Pages default) means served from the root.
const portalBase = (process.env.PORTAL_BASE ?? '').replace(/\/+$/, '');

export default defineConfig({
  base: portalBase ? `${portalBase}/` : '/',
  plugins: [tailwindcss()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: ['es2020', 'safari14'],
    rollupOptions: {
      input: {
        main: entry('./index.html'),
        profile: entry('./profile.html'),
        terms: entry('./terms.html')
      }
    }
  }
});
