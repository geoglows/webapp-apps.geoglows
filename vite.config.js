import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const entry = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [tailwindcss()],
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
