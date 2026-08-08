import { createFileRoute, Link } from "@tanstack/react-router";
import founderAsset from "@/assets/founder-genelo.jpg.asset.json";
import logoAsset from "@/assets/genelo-ai-logo.png.asset.json";
import { AdSenseUnit } from "@/components/AdSense";

const SITE_ORIGIN = "https://geneloai.lovable.app";
const FOUNDER_IMAGE = `${SITE_ORIGIN}${founderAsset.url}`;
const LOGO_IMAGE = `${SITE_ORIGIN}${logoAsset.url}`;
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
const AD_SLOT = import.meta.env.VITE_ADSENSE_SLOT_ID as string | undefined;

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
      { property: "og:url", content: `${SITE_ORIGIN}/contact` },
      { property: "og:image", content: FOUNDER_IMAGE },
      { name: "twitter:image", content: FOUNDER_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/contact` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Genelo AI",
          url: `${SITE_ORIGIN}/contact`,
          mainEntity: {
            "@type": "Organization",
            name: "Genelo AI",
            url: SITE_ORIGIN,
            logo: LOGO_IMAGE,
            image: [LOGO_IMAGE, FOUNDER_IMAGE],
            founder: {
              "@type": "Person",
              name: "Genelo Moses Mwazembe",
              url: `${SITE_ORIGIN}/about`,
              image: FOUNDER_IMAGE,
            },
            contactPoint: [
              {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: CONTACT_EMAIL,
                telephone: CONTACT_PHONE,
                areaServed: "TZ",
                availableLanguage: ["English", "Swahili"],
              },
            ],
            address: {
              "@type": "PostalAddress",
              streetAddress: ADDRESS.street,
              addressLocality: ADDRESS.city,
              addressRegion: ADDRESS.region,
              addressCountry: ADDRESS.country,
            },
            sameAs: [SOCIAL.tiktok, SOCIAL.tiktokAlt, SOCIAL.facebook],
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
        <div className="mb-6 flex items-center gap-3">
          <img
            src={LOGO_IMAGE}
            alt="Genelo AI logo"
            width={56}
            height={56}
            className="rounded-xl border border-border bg-background object-contain p-1 shadow-sm"
            loading="eager"
          />
          <div>
            <h1 className="m-0 text-4xl font-bold tracking-tight">Contact Genelo AI</h1>
            <p className="m-0 mt-1 text-sm text-muted-foreground">Founder & support in Tanzania</p>
          </div>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Reach the founder, Genelo Moses Mwazembe, or the Genelo AI support team.
        </p>

        <div className="my-6 grid gap-4 sm:grid-cols-2">
          <img
            src={FOUNDER_IMAGE}
            alt="Genelo Moses Mwazembe — founder of Genelo AI"
            width={400}
            height={400}
            className="w-full rounded-2xl border border-border object-cover shadow-sm"
            loading="eager"
          />
          <img
            src={LOGO_IMAGE}
            alt="Genelo AI official logo"
            width={400}
            height={400}
            className="w-full rounded-2xl border border-border bg-background object-contain p-6 shadow-sm"
            loading="lazy"
          />
        </div>

        <AdSenseUnit slot={AD_SLOT} format="auto" />

        <h2 className="mt-10 text-2xl font-semibold">Email</h2>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
        <p>
          For general inquiries, partnerships or press, you can also reach us at{" "}
          <a href="mailto:geneloai2@gmail.com" className="text-primary hover:underline">
            geneloai2@gmail.com
          </a>{" "}
          or{" "}
          <a href="mailto:genelopay@gmail.com" className="text-primary hover:underline">
            genelopay@gmail.com
          </a>.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Phone / WhatsApp</h2>
        <p>
          <a href={`tel:${CONTACT_PHONE}`} className="text-primary hover:underline">
            {CONTACT_PHONE}
          </a>
        </p>

        <AdSenseUnit slot={AD_SLOT} format="auto" />

        <h2 className="mt-10 text-2xl font-semibold">Address</h2>
        <p>
          {ADDRESS.street}<br />
          {ADDRESS.city}, {ADDRESS.region}<br />
          {ADDRESS.country}
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Social</h2>
        <ul>
          <li>TikTok: <a href={SOCIAL.tiktok} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@genelo_tz</a></li>
          <li>TikTok (alt): <a href={SOCIAL.tiktokAlt} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@softwareengineer010</a></li>
          <li>Facebook: <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Genelo Tz</a></li>
        </ul>

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
