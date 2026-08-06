import { createFileRoute, Link } from "@tanstack/react-router";
import { AdSenseUnit } from "@/components/AdSense";

const AD_SLOT = import.meta.env.VITE_ADSENSE_SLOT_ID as string | undefined;

const posts = [
  {
    slug: "welcome-to-genelo-ai",
    title: "Welcome to Genelo AI",
    excerpt:
      "An introduction to Genelo AI — what it does, who built it, and where it's going. Genelo AI combines chat, coding help, research, image generation and calculations in one fast, mobile-friendly interface.",
    date: "2026-06-24",
  },
  {
    slug: "meet-the-founder",
    title: "Meet the founder: Genelo Moses Mwazembe",
    excerpt:
      "The story of a young Tanzanian developer from Vwawa, Songwe, building an AI platform for Africa. Learn about Genelo's education at MoCU, his mission with GNL Technology, and the community that shaped him.",
    date: "2026-06-24",
  },
  {
    slug: "how-to-use-genelo-ai",
    title: "How to use Genelo AI for coding, research and images",
    excerpt:
      "A practical guide to getting the most out of Genelo AI's chat, image and research modes. Includes tips for front-end developers, students and everyday users in Tanzania and beyond.",
    date: "2026-06-24",
  },
  {
    slug: "genelo-ai-android-apk",
    title: "Download the Genelo AI Android app",
    excerpt:
      "Genelo AI is also available as an Android APK. This post explains how to install it, why we chose an APK release first, and what features are included in the mobile app.",
    date: "2026-08-06",
  },
  {
    slug: "pricing-and-pro-plan",
    title: "Genelo AI pricing: Free daily limits and Pro upgrades",
    excerpt:
      "A breakdown of the free daily image limits, the TSh 1,200 Pro plan, payment options through ZenoPay and Flutterwave, and which model is best for your task.",
    date: "2026-08-06",
  },
];

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Genelo AI Blog — Updates, guides and stories" },
      {
        name: "description",
        content:
          "News, tutorials and stories from Genelo AI — the AI platform built by Genelo Moses Mwazembe.",
      },
      { property: "og:title", content: "Genelo AI Blog" },
      { property: "og:description", content: "Updates, guides and stories from Genelo AI." },
      { property: "og:url", content: "https://geneloai.lovable.app/blog" },
    ],
    links: [{ rel: "canonical", href: "https://geneloai.lovable.app/blog" }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-foreground">
      <nav className="mb-8 text-sm">
        <Link to="/" className="text-primary hover:underline">← Back to Genelo AI</Link>
      </nav>
      <h1 className="text-4xl font-bold tracking-tight">Genelo AI Blog</h1>
      <p className="mt-3 text-muted-foreground">
        Updates, guides and stories from the team behind Genelo AI.
      </p>
      <ul className="mt-10 space-y-6">
        {posts.map((p) => (
          <li key={p.slug} className="border-b border-border pb-6">
            <Link
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="text-2xl font-semibold hover:text-primary"
            >
              {p.title}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">{p.date}</p>
            <p className="mt-2 text-base">{p.excerpt}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
