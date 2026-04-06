import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://diogorainhalopes.github.io',
  base: '/atahon',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [mdx(), react()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
    },
  },
});
