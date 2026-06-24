import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Genelo AI Documentation — Getting started & guides" },
      {
        name: "description",
        content:
          "Official documentation for Genelo AI: getting started, modes, image generation, pricing and account management.",
      },
      { property: "og:title", content: "Genelo AI Documentation" },
      {
        property: "og:description",
        content: "Guides and references for using Genelo AI by Genelo Moses Mwazembe.",
      },
      { property: "og:url", content: "https://geneloai.lovable.app/docs" },
    ],
    links: [{ rel: "canonical", href: "https://geneloai.lovable.app/docs" }],
  }),
  component: DocsPage,
});

function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-foreground">
      <nav className="mb-8 text-sm">
        <Link to="/" className="text-primary hover:underline">← Back to Genelo AI</Link>
      </nav>
      <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
      <p className="mt-3 text-muted-foreground">
        Everything you need to know to use Genelo AI effectively.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-semibold">Getting started</h2>
        <p>
          Create a free account using Google sign-in, then open the chat
          on the home page. Type any question and Genelo AI will respond.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-semibold">Modes</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Chat:</strong> fast everyday questions and conversation.</li>
          <li><strong>Research / Coding:</strong> deeper answers with code.</li>
          <li><strong>Image:</strong> generate images from a text prompt.</li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-semibold">Pricing</h2>
        <p>
          Free to start. Upgrade on the{" "}
          <Link to="/pricing" className="text-primary hover:underline">pricing page</Link>{" "}
          for higher limits and premium models.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-semibold">Support</h2>
        <p>
          Email <a href="mailto:support@geneloai.com" className="text-primary hover:underline">support@geneloai.com</a>.
        </p>
      </section>
    </main>
  );
}
