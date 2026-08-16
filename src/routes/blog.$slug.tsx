import type { ReactNode } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import logoAsset from "@/assets/genelo-ai-logo.png.asset.json";
import founderAsset from "@/assets/founder-genelo.jpg.asset.json";

type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  body: ReactNode;
};

const SITE_ORIGIN = "https://geneloai.lovable.app";
const FOUNDER_IMAGE = `${SITE_ORIGIN}${founderAsset.url}`;
const LOGO_IMAGE = `${SITE_ORIGIN}${logoAsset.url}`;

const POSTS: Record<string, Post> = {
  "welcome-to-genelo-ai": {
    slug: "welcome-to-genelo-ai",
    title: "Welcome to Genelo AI",
    date: "2026-06-24",
    description:
      "An introduction to Genelo AI — what it does, who built it, and where it's going.",
    body: (
      <>
        <p>
          Genelo AI is an AI assistant built for coding, research, image
          generation and quick answers. It is founded and owned by{" "}
          <strong>Genelo Moses Mwazembe</strong>, a young Tanzanian developer
          from Vwawa, Songwe.
        </p>
        <p>
          Our goal is simple: make powerful AI tools easy to use for African
          students, developers and creators, in one fast and friendly app.
        </p>
      </>
    ),
  },
  "meet-the-founder": {
    slug: "meet-the-founder",
    title: "Meet the founder: Genelo Moses Mwazembe",
    date: "2026-06-24",
    description:
      "The story of a young Tanzanian developer from Vwawa, Songwe, building an AI platform for Africa.",
    body: (
      <>
        <p>
          Genelo Moses Mwazembe grew up on Gym Road, Ichenjezya, in Vwawa,
          Songwe Region, Tanzania. The son of Moses Mwazembe and Bertha
          Kajiba, he discovered programming as a teenager and has been
          building software ever since.
        </p>
        <p>
          Genelo AI is his flagship project — an AI platform he designed,
          built and continues to maintain. He is the sole owner of Genelo
          AI.
        </p>
      </>
    ),
  },
  "how-to-use-genelo-ai": {
    slug: "how-to-use-genelo-ai",
    title: "How to use Genelo AI for coding, research and images",
    date: "2026-06-24",
    description:
      "A practical guide to getting the most out of Genelo AI's chat, image and research modes.",
    body: (
      <>
        <p>
          Genelo AI offers several modes: a fast chat model for everyday
          questions, a deeper model for research and coding, and an image
          generation mode. Pick a mode from the selector and start typing.
        </p>
        <p>
          For best results, be specific. Instead of "make me a website",
          try "build a one-page portfolio with a dark theme, hero section
          and a contact form".
        </p>
      </>
    ),
  },
  "genelo-ai-indexed-on-google": {
    slug: "genelo-ai-indexed-on-google",
    title: "Genelo AI is indexed on Google — features, photos and how we published",
    date: "2026-08-16",
    description:
      "We published Genelo AI with features, founder photos and structured data so Google can index it quickly. This post explains what's included and how we made the site discoverable.",
    body: (
      <>
        <p>
          We launched Genelo AI with a focus on clarity, fast load times, and
          metadata that search engines understand. The site already shows up in
          Google search results — here’s how we structured the post so it’s
          discoverable and shareable.
        </p>

        <figure>
          <img
            src={FOUNDER_IMAGE}
            alt="Genelo Moses Mwazembe — founder of Genelo AI"
            style={{ maxWidth: "100%", borderRadius: 8 }}
            loading="eager"
          />
          <figcaption className="text-sm text-muted-foreground">Genelo Moses Mwazembe — founder</figcaption>
        </figure>

        <h2>Key features included</h2>
        <ul>
          <li><strong>Clear title & description:</strong> Unique title and meta description for the post.</li>
          <li><strong>Open Graph & Twitter image:</strong> og:image and twitter:image so shares look good.</li>
          <li><strong>Structured data (JSON‑LD):</strong> BlogPosting schema with headline, datePublished, author and publisher.</li>
          <li><strong>Canonical URL & sitemap:</strong> canonical link provided and sitemap updated so crawlers can find the page.</li>
          <li><strong>Images:</strong> founder and logo images added and referenced with absolute URLs so Google can fetch them.</li>
        </ul>

        <h2>How we published</h2>
        <p>
          The blog page uses explicit head metadata (title, description, og:, canonical)
          and a small JSON-LD block (BlogPosting) so Google understands this is an article. After publishing we:
        </p>
        <ol>
          <li>Made sure the page is reachable from the main navigation and sitemap</li>
          <li>Checked robots.txt and that the page is not blocked</li>
          <li>Used Google Search Console → URL Inspection → Request indexing (optional but speeds things up)</li>
        </ol>

        <p>
          If you'd like, I can also add og:image and include the founder image in the JSON-LD block in the route head.
        </p>
      </>
    ),
  },
};

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = POSTS[params.slug];
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.title} — Genelo AI Blog` },
            { name: "description", content: loaderData.description },
            { name: "author", content: "Genelo Moses Mwazembe" },
            { property: "og:title", content: loaderData.title },
            { property: "og:description", content: loaderData.description },
            { property: "og:type", content: "article" },
            {
              property: "og:url",
              content: `https://geneloai.lovable.app/blog/${loaderData.slug}`,
            },
            { property: "og:image", content: FOUNDER_IMAGE },
            { name: "twitter:image", content: FOUNDER_IMAGE },
          ],
          links: [
            {
              rel: "canonical",
              href: `https://geneloai.lovable.app/blog/${loaderData.slug}`,
            },
          ],
          scripts: [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                headline: loaderData.title,
                datePublished: loaderData.date,
                image: FOUNDER_IMAGE,
                author: {
                  "@type": "Person",
                  name: "Genelo Moses Mwazembe",
                  url: "https://geneloai.lovable.app/about",
                },
                publisher: {
                  "@type": "Organization",
                  name: "Genelo AI",
                  url: "https://geneloai.lovable.app",
                  logo: LOGO_IMAGE,
                },
              }),
            },
          ],
        }
      : { meta: [{ title: "Post not found — Genelo AI" }] },
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-5 py-12 text-foreground">
      <p>Post not found.</p>
      <Link to="/blog" className="text-primary hover:underline">← Back to blog</Link>
    </main>
  ),
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-3xl px-5 py-12 text-foreground">
      <p>Something went wrong: {error.message}</p>
    </main>
  ),
  component: PostPage,
});

function PostPage() {
  const post = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-foreground">
      <nav className="mb-8 text-sm">
        <Link to="/blog" className="text-primary hover:underline">← All posts</Link>
      </nav>
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{post.date} · by Genelo Moses Mwazembe</p>
        <div className="mt-8 space-y-4 text-base leading-relaxed">{post.body}</div>
      </article>
    </main>
  );
}
