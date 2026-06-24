import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://geneloai.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const paths = [
          { path: "/", priority: "1.0", changefreq: "weekly" },
          { path: "/about", priority: "0.9", changefreq: "monthly" },
          { path: "/blog", priority: "0.8", changefreq: "weekly" },
          { path: "/blog/welcome-to-genelo-ai", priority: "0.7", changefreq: "monthly" },
          { path: "/blog/meet-the-founder", priority: "0.7", changefreq: "monthly" },
          { path: "/blog/how-to-use-genelo-ai", priority: "0.7", changefreq: "monthly" },
          { path: "/docs", priority: "0.8", changefreq: "monthly" },
          { path: "/pricing", priority: "0.7", changefreq: "monthly" },
          { path: "/login", priority: "0.5", changefreq: "yearly" },
        ];
        const urls = paths
          .map(
            (e) =>
              `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
