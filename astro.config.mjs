import { defineConfig } from 'astro/config';
import { repositoryFiles } from './src/lib/public-files.mjs';

export default defineConfig({
  base: '/dba-playbook',
  compressHTML: false,
  build: {
    format: 'preserve',
    inlineStylesheets: 'always',
  },
  integrations: [repositoryFiles()],
});
