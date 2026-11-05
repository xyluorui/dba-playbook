import { posix } from 'node:path';
import { load } from 'cheerio';
import { marked } from 'marked';
import { relativeHref, type SiteSection } from './links';

export interface ContentArticle {
  path: string;
  directory: string;
  section: SiteSection;
  title: string;
  titleHtml: string;
  titleId?: string;
  description: string;
  meta: Record<string, string>;
  headStyles: string;
  versionHtml?: string;
  html: string;
  outline: { id: string; title: string; level: number }[];
  indexable: boolean;
}

export interface ContentDirectory {
  path: string;
  section: SiteSection;
  title: string;
  description: string;
  readme: string;
  childPaths: string[];
  articlePaths: string[];
  articleCount: number;
}

export const sectionLabels: Record<SiteSection, string> = {
  home: '首页', mysql: 'MySQL', redis: 'Redis', labs: '实验室', practice: '实战',
};

export function sectionFor(path: string): SiteSection {
  if (path === 'index.html') return 'home';
  if (path.startsWith('docs/02-mysql/')) return 'mysql';
  if (path.startsWith('docs/04-redis/')) return 'redis';
  if (path.startsWith('labs/')) return 'labs';
  return 'practice';
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: '草稿', stable: '稳定', review: '待审核', done: '完成', deprecated: '已弃用',
  };
  return labels[status] ?? status;
}

const sources = import.meta.glob<string>([
  '/{docs,cases,runbooks,labs,scripts,templates}/**/*.html',
  '/{docs,cases,runbooks,labs,scripts,templates,assets}/**/README.md',
  '!/**/index.html',
  '!/**/{node_modules,tmp,temp,__pycache__}/**',
  '!/labs/app/**',
  '!/scripts/site/page-template.html',
], { eager: true, query: '?raw', import: 'default' });

const sortedSources = Object.entries(sources).sort(([a], [b]) => a.localeCompare(b, 'en'));
const directoriesBySourcePath = new Map<string, ContentDirectory>();

function directoryFor(sourcePath: string): ContentDirectory {
  const existing = directoriesBySourcePath.get(sourcePath);
  if (existing) return existing;

  const path = `${sourcePath}/index.html`;
  const directory = {
    path,
    section: sectionFor(path),
    title: posix.basename(sourcePath),
    description: '',
    readme: '',
    childPaths: [],
    articlePaths: [],
    articleCount: 0,
  } satisfies ContentDirectory;
  directoriesBySourcePath.set(sourcePath, directory);
  const parent = posix.dirname(sourcePath);
  if (parent !== '.') directoryFor(parent).childPaths.push(path);
  return directory;
}

function parseArticle(path: string, source: string): ContentArticle {
  const html = source
    .replace(/<!-- fallback-style:start[\s\S]*?<!-- fallback-style:end\s*-->/g, '')
    .replace(/<!-- page-head:start[\s\S]*?<!-- page-head:end\s*-->/g, '');
  const $ = load(html, { scriptingEnabled: false });
  const body = $('article.content').first();
  const heading = body.children('h1').first();
  const title = heading.text().trim();
  if (!body.length || !title) throw new Error(`${path}: 缺少 article.content 或正文 h1`);

  const meta: Record<string, string> = {};
  $('head meta[name]').each((_, node) => {
    const name = $(node).attr('name')?.trim().toLowerCase();
    const content = $(node).attr('content')?.trim();
    if (name && content && name !== 'viewport') meta[name] = content;
  });

  const requiresMetadata = /^(docs|cases|labs)\//.test(path);
  for (const name of ['database', 'status']) {
    if (requiresMetadata && !meta[name]) throw new Error(`${path}: 缺少 ${name} 元信息`);
  }

  const titleHtml = heading.html() ?? '';
  const titleId = heading.attr('id');
  const ids = new Set(body.find('[id]').toArray().map((node) => $(node).attr('id')));
  heading.remove();
  const lead = body.children().first();
  const leadIsVersion = lead.hasClass('version') || /^(适用|适用版本)\s*[：:]/.test(lead.text().trim());
  const versionHtml = leadIsVersion ? $.html(lead) : undefined;
  if (leadIsVersion) lead.remove();

  const headStyles = $('head style').toArray().map((node) => $.html(node)).join('\n');
  const descriptionText = (meta.description || body.children('p').first().text() || lead.text())
    .replace(/\s+/g, ' ').trim();
  const description = descriptionText.length > 150 ? `${descriptionText.slice(0, 150)}…` : descriptionText;
  let nextSection = 1;
  const outline = body.find('h2, h3').toArray().map((node) => {
    const heading = $(node);
    let id = heading.attr('id');
    if (!id) {
      do { id = `sec-${nextSection++}`; } while (ids.has(id));
      ids.add(id);
      heading.attr('id', id);
    }
    return { id, title: heading.text().trim(), level: Number(node.tagName.slice(1)) };
  });

  return {
    path, directory: `${posix.dirname(path)}/index.html`, section: sectionFor(path),
    title, titleHtml, titleId, description, meta, headStyles, versionHtml,
    html: body.html() ?? '', outline, indexable: !path.startsWith('templates/'),
  };
}

export const articles: ContentArticle[] = [];
for (const [file, source] of sortedSources) {
  const path = file.slice(1);
  const directory = directoryFor(posix.dirname(path));
  if (path.endsWith('/README.md')) {
    const $ = load(marked.parse(source, { async: false }), { scriptingEnabled: false }, false);
    const heading = $('h1').first();
    directory.title = heading.text().trim() || directory.title;
    const intro = heading.next('p');
    directory.description = intro.text().replace(/\s+/g, ' ').trim();
    heading.remove();
    directory.readme = $.html();
    continue;
  }

  articles.push(parseArticle(path, source));
  directory.articlePaths.push(path);
}

const practice = directoryFor('practice');
practice.title = '实战资料';
practice.description = '按场景查找真实案例、可照做的操作手册和可复用脚本。';
practice.childPaths.push('cases/index.html', 'runbooks/index.html', 'scripts/index.html');

export const directories = Array.from(directoriesBySourcePath.values());
export const articlesByPath = new Map(articles.map((article) => [article.path, article]));
export const directoriesByPath = new Map(directories.map((directory) => [directory.path, directory]));

export function topicScope(path: string) {
  const [root, group] = path.split('/');
  const section = sectionFor(path);
  const folder = section === 'mysql' || section === 'redis' ? `${root}/${group}` : root;
  return directoriesByPath.get(`${folder}/index.html`);
}

const redisTopicOrder = [
  'architecture', 'deployment', 'persistence', 'cluster-ha', 'performance', 'memory-analysis', 'monitoring',
];

for (const directory of directories) {
  const order = (path: string) => {
    const index = redisTopicOrder.indexOf(posix.basename(posix.dirname(path)));
    return directory.path === 'docs/04-redis/index.html' && index >= 0 ? index : redisTopicOrder.length;
  };
  if (directory !== practice) {
    directory.childPaths.sort((a, b) => order(a) - order(b) || a.localeCompare(b, 'en'));
  }
  const base = posix.dirname(directory.path);
  directory.articleCount = articles.filter((article) => article.path.startsWith(`${base}/`)).length;
  if (!directory.readme) continue;

  const $ = load(directory.readme, { scriptingEnabled: false }, false);
  $('a[href]').each((_, node) => {
    const link = $(node);
    const href = link.attr('href') ?? '';
    if (!href || /^(?:[a-z][a-z\d+.-]*:|[\/#?])/i.test(href)) return;
    const separator = href.search(/[#?]/);
    const target = separator < 0 ? href : href.slice(0, separator);
    const suffix = separator < 0 ? '' : href.slice(separator);
    const resolved = posix.normalize(posix.join(base, target));
    const index = resolved.endsWith('/README.md')
      ? posix.join(posix.dirname(resolved), 'index.html')
      : posix.join(resolved, 'index.html');
    if (index === 'index.html' || directoriesByPath.has(index)) {
      link.attr('href', `${relativeHref(directory.path, index)}${suffix}`);
    }
  });
  directory.readme = $.html();
}
