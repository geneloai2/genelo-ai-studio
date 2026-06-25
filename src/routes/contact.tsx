import { createFileRoute, Link } from "@tanstack/react-router";

const CONTACT_EMAIL = "support@geneloai.com";
const CONTACT_PHONE = "+255621673848";
const SOCIAL = {
  tiktok: "https://www.tiktok.com/@genelo_tz",
  tiktokAlt: "https://www.tiktok.com/@softwareengineer010",
  facebook: "https://www.facebook.com/genelo.tz",
};
const ADDRESS = {
  street: "Gym Road, Ichenjezya",
  city: "Vwawa",
  region: "Songwe Region",
  country: "Tanzania",
};

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Genelo AI — Founder, Email, Phone & Support" },
      {
        name: "description",
        content:
          "Contact Genelo AI. Reach founder Genelo Moses Mwazembe and the support team by email, phone or post at Vwawa, Songwe Region, Tanzania.",
      },
      { name: "author", content: "Genelo Moses Mwazembe" },
      { property: "og:title", content: "Contact Genelo AI — Founder, Email, Phone & Support" },
      {
        property: "og:description",
        content:
          "Reach Genelo AI and founder Genelo Moses Mwazembe by email, phone or post in Tanzania.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://geneloai.lovable.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://geneloai.lovable.app/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Genelo AI",
          url: "https://geneloai.lovable.app/contact",
          mainEntity: {
            "@type": "Organization",
            name: "Genelo AI",
            url: "https://geneloai.lovable.app",
            founder: {
              "@type": "Person",
              name: "Genelo Moses Mwazembe",
              url: "https://geneloai.lovable.app/about",
              image: "https://geneloai.lovable.app/founder-genelo.jpg",
            },
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: CONTACT_EMAIL,
              areaServed: "TZ",
              availableLanguage: ["English", "Swahili"],
            },
            address: {
              "@type": "PostalAddress",
              streetAddress: ADDRESS.street,
              addressLocality: ADDRESS.city,
              addressRegion: ADDRESS.region,
              addressCountry: ADDRESS.country,
            },
          },
        }),
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-foreground">
      <nav className="mb-8 text-sm">
        <Link to="/" className="text-primary hover:underline">← Back to Genelo AI</Link>
      </nav>
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight">Contact Genelo AI</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Reach the founder, Genelo Moses Mwazembe, or the Genelo AI support team.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Email</h2>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Phone</h2>
        <p className="text-muted-foreground">
          A phone number will be added here soon. Please share the number you want listed.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Address</h2>
        <p>
          {ADDRESS.street}<br />
          {ADDRESS.city}, {ADDRESS.region}<br />
          {ADDRESS.country}
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Founder</h2>
        <p>
          Genelo Moses Mwazembe — founder, owner and lead engineer of Genelo AI.
          Learn more on the{" "}
          <Link to="/about" className="text-primary hover:underline">About page</Link>.
        </p>
      </article>
    </main>
  );
}
