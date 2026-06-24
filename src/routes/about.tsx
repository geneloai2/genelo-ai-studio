import { createFileRoute, Link } from "@tanstack/react-router";

const FOUNDER_IMAGE = "https://geneloai.lovable.app/founder-genelo.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Genelo AI — Founded by Genelo Moses Mwazembe" },
      {
        name: "description",
        content:
          "Genelo AI is built by Genelo Moses Mwazembe, a young Tanzanian developer from Vwawa, Songwe. Learn the story, mission, contact details and people behind Genelo AI.",
      },
      { name: "author", content: "Genelo Moses Mwazembe" },
      { property: "og:title", content: "About Genelo AI — Founded by Genelo Moses Mwazembe" },
      {
        property: "og:description",
        content:
          "The story of Genelo AI and its founder Genelo Moses Mwazembe from Songwe, Tanzania.",
      },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: "https://geneloai.lovable.app/about" },
      { property: "og:image", content: FOUNDER_IMAGE },
      { name: "twitter:image", content: FOUNDER_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://geneloai.lovable.app/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Genelo Moses Mwazembe",
          alternateName: ["Genelo", "Genelo Mwazembe"],
          jobTitle: "Founder & Developer",
          worksFor: { "@type": "Organization", name: "Genelo AI", url: "https://geneloai.lovable.app" },
          url: "https://geneloai.lovable.app/about",
          image: FOUNDER_IMAGE,
          nationality: "Tanzanian",
          birthPlace: {
            "@type": "Place",
            name: "Vwawa, Songwe Region, Tanzania",
          },
          description:
            "Genelo Moses Mwazembe is the founder and owner of Genelo AI, an AI platform for coding, research, image generation and answers.",
          sameAs: [],
        }),
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-foreground">
      <nav className="mb-8 text-sm">
        <Link to="/" className="text-primary hover:underline">← Back to Genelo AI</Link>
      </nav>
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight">About Genelo AI</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Genelo AI is an AI assistant for coding, research, image generation
          and everyday questions — founded and built by{" "}
          <strong>Genelo Moses Mwazembe</strong>.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Who is Genelo Moses Mwazembe?</h2>
        <p>
          Genelo Moses Mwazembe is a young Tanzanian software developer and
          the founder, owner and lead engineer of Genelo AI. He was born and
          raised on Gym Road, Ichenjezya, Vwawa, in the Songwe Region of
          Tanzania. From an early age he has been passionate about computers,
          programming and artificial intelligence.
        </p>
        <p>
          Today he uses that passion to build Genelo AI — a platform designed
          to make modern AI tools accessible to students, developers and
          everyday users across Tanzania and the world.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Mission</h2>
        <p>
          Genelo AI exists to put fast, reliable and affordable AI in the
          hands of African creators and learners. We focus on front-end
          coding help, research, teaching, image generation, Q&amp;A and
          quick calculations — all in one simple interface.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Family</h2>
        <ul>
          <li><strong>Father:</strong> Moses Mwazembe</li>
          <li><strong>Mother:</strong> Bertha Kajiba</li>
          <li><strong>Grandfather:</strong> Anyumiste Kajiba</li>
          <li><strong>Big brother:</strong> Jackson Moses Mwazembe</li>
          <li><strong>Younger brother:</strong> Award Moses Mwazembe</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold">Hometown</h2>
        <p>
          Gym Road, Ichenjezya, Vwawa, Songwe Region, Tanzania 🇹🇿
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Contact</h2>
        <p>
          For support, partnerships or press, reach the Genelo AI team at{" "}
          <a href="mailto:support@geneloai.com" className="text-primary hover:underline">
            support@geneloai.com
          </a>.
        </p>
      </article>
    </main>
  );
}
