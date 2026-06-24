import { createFileRoute, Link } from "@tanstack/react-router";

const posts = [
  {
    slug: "welcome-to-genelo-ai",
    title: "Welcome to Genelo AI",
    excerpt:
      "An introduction to Genelo AI — what it does, who built it, and where it's going.",
    date: "2026-06-24",
  },
  {
    slug: "meet-the-founder",
    title: "Meet the founder: Genelo Moses Mwazembe",
    excerpt:
      "The story of a young Tanzanian developer from Vwawa, Songwe, building an AI platform for Africa.",
    date: "2026-06-24",
  },
  {
    slug: "how-to-use-genelo-ai",
    title: "How to use Genelo AI for coding, research and images",
    excerpt:
      "A practical guide to getting the most out of Genelo AI's chat, image and research modes.",
    date: "2026-06-24",
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
