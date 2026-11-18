import { readFileSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const output = join(repository, 'dist');
const base = '/dba-playbook/';
const origin = 'https://preview.invalid';
const contentRoots = ['assets', 'cases', 'docs', 'labs', 'runbooks', 'scripts', 'templates'];
const publishedRoots = new Set([...contentRoots, '_astro', 'pagefind', 'practice']);
const publishedRootFiles = new Set(['404.html', 'AGENTS.md', 'CONTRIBUTING.md', 'README.md', 'index.html']);
const privateFile = /^(?:\.|id_rsa|id_ed25519)|(?:credential|secret)|\.(?:sql\.gz|sql\.bz2|dump|dmp|rdb|aof|bak|csv|pem|key)$/i;
const errors = [];

function* walk(directory, relative = '') {
  for (const entry of readdirSync(join(directory, relative), { withFileTypes: true })) {
    const path = posix.join(relative, entry.name);
    if (entry.isDirectory()) {
      yield* walk(directory, path);
    } else {
      yield { path, isFile: entry.isFile() };
    }
  }
}

const files = new Set();
for (const { path, isFile } of walk(output)) {
  const segments = path.split('/');
  const root = segments[0];
  const allowed = segments.length === 1 ? publishedRootFiles.has(root) : publishedRoots.has(root);
  const siteTool = path.startsWith('scripts/site/') && !['scripts/site/index.html', 'scripts/site/README.md'].includes(path);
  if (!isFile || !allowed || siteTool || segments.some((segment) => privateFile.test(segment))) {
    errors.push(`发布文件不在允许范围内：${path}`);
  }
  if (isFile) files.add(path);
}

function parse(directory, path) {
  return load(readFileSync(join(directory, path), 'utf8'), { scriptingEnabled: false });
}

function anchors($, selector = '[id], a[name]') {
  return new Set($(selector).toArray().map((node) => node.attribs.id ?? node.attribs.name));
}

const pages = new Map();
for (const path of files) {
  if (path.endsWith('.html')) {
    const $ = parse(output, path);
    pages.set(path, { $, anchors: anchors($) });
  }
}

const oldRoutes = ['index.html'];
for (const root of contentRoots) {
  for (const { path, isFile } of walk(repository, root)) {
    if (isFile && path.endsWith('.html') && path !== 'scripts/site/page-template.html') oldRoutes.push(path);
  }
}

for (const path of [...oldRoutes, 'practice/index.html', 'pagefind/pagefind.js', 'pagefind/pagefind-entry.json']) {
  if (!files.has(path)) errors.push(`发布缺少文件：${path}`);
}

for (const path of oldRoutes) {
  const [root] = path.split('/');
  if (!['docs', 'cases', 'runbooks', 'labs'].includes(root) || path.endsWith('/index.html') || !pages.has(path)) continue;
  const source = parse(repository, path);
  const built = pages.get(path);
  for (const id of anchors(source, 'article :is(h1, h2, h3, h4, h5, h6)[id], article a[name]')) {
    if (!built.anchors.has(id)) errors.push(`旧章节锚点缺失：${path}#${id}`);
  }
  for (const selector of ['article svg', 'article pre > code']) {
    if (built.$(selector).length < source(selector).length) errors.push(`正文元素缺失：${path} 中的 ${selector}`);
  }
  if (root === 'docs' || root === 'cases') {
    for (const key of ['database', 'status']) {
      const selector = `head meta[name="${key}"]`;
      const original = source(selector).attr('content')?.trim();
      if (!original || built.$(selector).attr('content')?.trim() !== original) {
        errors.push(`元信息缺失或变化：${path} 中的 ${key}`);
      }
    }
  }
}

function validateLink(source, href) {
  const reference = href.trim();
  if (!reference || /^(?:https?:|mailto:|tel:|data:|\/\/)/i.test(reference)) return;
  if (reference.startsWith('/') && !reference.startsWith(`${base}_astro/`)) {
    errors.push(`使用根路径链接：${source} → ${href}`);
    return;
  }
  try {
    const url = new URL(reference, `${origin}${base}${source}`);
    if (url.origin !== origin || !url.pathname.startsWith(base)) {
      errors.push(`链接离开站点子路径：${source} → ${href}`);
      return;
    }
    const pathname = decodeURIComponent(url.pathname.slice(base.length));
    const target = files.has(pathname) ? pathname : posix.join(pathname, 'index.html');
    if (!files.has(target)) {
      errors.push(`链接失效：${source} → ${href}`);
    } else if (url.hash && pages.has(target) && !pages.get(target).anchors.has(decodeURIComponent(url.hash.slice(1)))) {
      errors.push(`锚点失效：${source} → ${href}`);
    }
  } catch (error) {
    if (!(error instanceof URIError || error instanceof TypeError)) throw error;
    errors.push(`链接格式无效：${source} → ${href}`);
  }
}

const linkAttributes = ['href', 'src', 'poster', 'xlink:href'];
for (const [path, { $ }] of pages) {
  const links = new Set();
  for (const element of $('[href], [src], [poster], [xlink\\:href]').toArray()) {
    for (const attribute of linkAttributes) {
      const href = element.attribs[attribute];
      if (href) links.add(href);
    }
  }
  for (const href of links) validateLink(path, href);
}

for (const error of errors) console.error(`[error] ${error}`);
console.log(`发布校验：${pages.size} 个 HTML 页面，${errors.length} 个错误`);
process.exitCode = errors.length ? 1 : 0;
