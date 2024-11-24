import { defineConfig } from "astro/config";
import { astroImageTools } from "astro-imagetools";
import compress from "astro-compress";
import sitemap from "astro-sitemap";
import mdx from "@astrojs/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import redirects from "/src/redirects.json";
const noSitemap = new Set(Object.keys(redirects));
noSitemap.add("chicago");
noSitemap.add("lease");
noSitemap.add("public");
noSitemap.add("music");

export default defineConfig({
  site: "https://juanmarino.com",
  markdown: {
    shikiConfig: {
      theme: "github-light",
      lineNumbers: true,
      wrap: true,
    },
  },
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
      gfm: true,
    }),
    astroImageTools,
    compress({
      img: false,
      Image: false,
    }),
    sitemap({
      filter(page) {
        const routeFirst = page.split("/")[0];
        if (noSitemap.has(routeFirst)) return false;
        return true;
      },
    }),
  ],
});