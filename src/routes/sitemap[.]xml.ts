import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { BRAND_LOGO_ABSOLUTE } from "@/lib/brand";

const BASE_URL = "https://geneloai.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const LOGO = BRAND_LOGO_ABSOLUTE;
        const FOUNDER = `${BASE_URL}/__l5e/assets-v1/68d35b19-9dec-4b11-b4bd-3d2f1dbda74f/founder-genelo-2.jpg`;
        const images: Record<string, { url: string; title: string }[]> = {
          "/": [{ url: LOGO, title: "GNLTECH — official brand of Genelo AI" }],
          "/about": [
            { url: FOUNDER, title: "Genelo Moses Mwazembe — founder of Genelo AI" },
            { url: LOGO, title: "GNLTECH — official brand of Genelo AI" },
          ],
          "/blog/meet-the-founder": [
            { url: FOUNDER, title: "Genelo Moses Mwazembe — founder of Genelo AI" },
          ],
        };
        const paths = [
          { path: "/", priority: "1.0", changefreq: "weekly" },
          { path: "/about", priority: "0.9", changefreq: "monthly" },
          { path: "/contact", priority: "0.9", changefreq: "monthly" },
          { path: "/blog", priority: "0.8", changefreq: "weekly" },
          { path: "/blog/welcome-to-genelo-ai", priority: "0.7", changefreq: "monthly" },
          { path: "/blog/meet-the-founder", priority: "0.7", changefreq: "monthly" },
          { path: "/blog/how-to-use-genelo-ai", priority: "0.7", changefreq: "monthly" },
          { path: "/docs", priority: "0.8", changefreq: "monthly" },
          { path: "/pricing", priority: "0.7", changefreq: "monthly" },
          { path: "/login", priority: "0.5", changefreq: "yearly" },
        ];
        const urls = paths
          .map((e) => {
            const imgs = (images[e.path] ?? [])
              .map(
                (i) =>
                  `\n    <image:image>\n      <image:loc>${i.url}</image:loc>\n      <image:title>${i.title}</image:title>\n    </image:image>`,
              )
              .join("");
            return `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>${imgs}\n  </url>`;
          })
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>`;
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
