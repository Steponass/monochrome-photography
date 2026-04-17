import { defineConfig, envField } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  integrations: [svelte()],
  env: {
    schema: {
      STRIPE_SECRET_KEY: envField.string({
        context: 'server',
        access: 'secret',
      }),
      SITE_URL: envField.string({
        context: 'server',
        access: 'secret',
      }),
    },
  },
});