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
      input: {
        main: entry('./index.html'),
        profile: entry('./profile.html'),
        terms: entry('./terms.html')
      }
    }
  }
});
