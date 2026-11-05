import { posix } from 'node:path';

export type SiteSection = 'home' | 'mysql' | 'redis' | 'labs' | 'practice';

export const navigation: { section: SiteSection; title: string; path: string }[] = [
  { section: 'home', title: '首页', path: 'index.html' },
  { section: 'mysql', title: 'MySQL', path: 'docs/02-mysql/index.html' },
  { section: 'redis', title: 'Redis', path: 'docs/04-redis/index.html' },
  { section: 'labs', title: '实验室', path: 'labs/index.html' },
  { section: 'practice', title: '实战', path: 'practice/index.html' },
];

export function relativeHref(fromPath: string, toPath: string) {
  const suffixStart = toPath.search(/[?#]/);
  const target = suffixStart === -1 ? toPath : toPath.slice(0, suffixStart);
  const suffix = suffixStart === -1 ? '' : toPath.slice(suffixStart);
  return posix.relative(posix.dirname(fromPath), target) + suffix;
}
