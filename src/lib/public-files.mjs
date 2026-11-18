import { createReadStream } from 'node:fs';
import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const contentRoots = ['docs', 'cases', 'runbooks', 'labs', 'scripts', 'templates', 'assets'];
const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.md', 'text/plain; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.avif', 'image/avif'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.pdf', 'application/pdf'],
  ['.woff2', 'font/woff2'],
]);
const media = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.pdf', '.woff2']);
const sharedAssets = new Set(['shell.js', 'tokens.css', 'highlight.min.js', 'mermaid.min.js']);

function allowed(directory, filename) {
  const extension = extname(filename).toLowerCase();
  if (filename === 'README.md' || filename === 'AGENTS.md') return true;
  if (directory === 'templates' && filename.endsWith('-template.md')) return true;
  if (directory.startsWith('labs/') && filename === 'design-card.md') return true;
  if (directory === 'labs/app' && filename === 'index.html') return true;
  if (directory.startsWith('labs/app/') && ['.js', '.css'].includes(extension)) return true;
  if (directory === 'assets/site') return sharedAssets.has(filename);
  if (directory === 'assets' || directory.startsWith('assets/')) return media.has(extension);
  return /^scripts\/(mysql|redis|shell|python)(\/|$)/.test(directory) &&
    ['.sql', '.sh', '.py', '.ps1'].includes(extension);
}

function skipped(name) {
  return name.startsWith('.') || /(?:credential|secret)/i.test(name) ||
    ['__pycache__', 'node_modules', 'tmp', 'temp'].includes(name);
}

async function publicFiles() {
  const files = new Set(['README.md', 'CONTRIBUTING.md', 'AGENTS.md']);

  async function collect(directory) {
    for (const item of await readdir(join(root, directory), { withFileTypes: true })) {
      if (skipped(item.name)) continue;
      const path = directory + '/' + item.name;
      if (item.isDirectory()) await collect(path);
      if (item.isFile() && allowed(directory, item.name)) files.add(path);
    }
  }

  await Promise.all(contentRoots.map(collect));
  return files;
}

export function repositoryFiles() {
  return {
    name: 'dba-repository-files',
    hooks: {
      async 'astro:server:setup'({ server }) {
        const base = server.config.base;
        const files = await publicFiles();
        server.middlewares.use(async (request, response, next) => {
          if (request.method !== 'GET' && request.method !== 'HEAD') return next();
          try {
            const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
            if (!pathname.startsWith(base)) return next();
            const path = pathname.slice(base.length);
            const file = path === 'labs/app/' ? 'labs/app/index.html' : path;
            if (!files.has(file)) return next();

            const source = join(root, file);
            const info = await stat(source);
            response.setHeader('Content-Type', mimeTypes.get(extname(file)) ?? 'application/octet-stream');
            response.setHeader('Content-Length', info.size);
            if (request.method === 'HEAD') return response.end();
            createReadStream(source).on('error', next).pipe(response);
          } catch (error) {
            next(error);
          }
        });
      },
      async 'astro:build:done'({ dir }) {
        const output = fileURLToPath(dir);
        for (const file of await publicFiles()) {
          const target = join(output, file);
          await mkdir(dirname(target), { recursive: true });
          await copyFile(join(root, file), target);
        }
      },
    },
  };
}
