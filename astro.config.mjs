import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://akifzahin.dev",
  output: "static",
  adapter: vercel(),
  integrations: [sitemap()],
});
