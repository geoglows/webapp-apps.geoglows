import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
import tailwindcss from '@tailwindcss/vite';

const entry = (path) => fileURLToPath(new URL(path, import.meta.url));

const cleanUrls = () => {
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
      input: {
        main: entry('./index.html'),
        profile: entry('./profile/index.html'),
        terms: entry('./terms/index.html'),
        licenses: entry('./licenses/index.html')
      }
    }
  }
});
