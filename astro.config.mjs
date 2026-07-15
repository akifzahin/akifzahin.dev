import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://akifzahin.dev',
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap(), react()],
});