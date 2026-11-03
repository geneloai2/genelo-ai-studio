import { createFileRoute, Link } from "@tanstack/react-router";
import founderAsset from "@/assets/founder-genelo.jpg.asset.json";
import { BRAND_LOGO, BRAND_LOGO_ABSOLUTE, BRAND_WEBSITE } from "@/lib/brand";

const SITE = "https://geneloai.lovable.app";
const PHOTO = `${SITE}${founderAsset.url}`;
const TITLE = "Genelo Moses Mwazembe — Official Photo | Founder of Genelo AI & GNLTECH";
const DESC =
  "Official photo of Genelo Moses Mwazembe (Dumbile), Tanzanian software developer, Founder & CEO of GNLTECH (GNL Technology) and creator of Genelo AI, Genelo Pay and Genelo Shop.";

export const Route = createFileRoute("/founder")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: `${SITE}/founder` },
      { property: "og:image", content: PHOTO },
      { property: "og:image:alt", content: "Genelo Moses Mwazembe, founder of Genelo AI and GNLTECH" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: PHOTO },
    ],
    links: [{ rel: "canonical", href: `${SITE}/founder` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          url: `${SITE}/founder`,
          name: TITLE,
          mainEntity: {
            "@type": "Person",
            "@id": `${SITE}/founder#person`,
            name: "Genelo Moses Mwazembe",
            alternateName: ["Dumbile", "Genelo Mwazembe", "Genelo Moses"],
            jobTitle: "Founder & CEO",
            nationality: "Tanzanian",
            image: { "@id": `${SITE}/founder#photo` },
            worksFor: { "@id": "https://gnltech.wuaze.com/#organization", "@type": "Organization", name: "GNLTECH", url: BRAND_WEBSITE, logo: BRAND_LOGO_ABSOLUTE },
            founder: undefined,
            sameAs: [
              `${SITE}/about`,
              "https://github.com/GeneloMosesMwazembe",
              "https://www.facebook.com/genelo.tz",
              "https://www.tiktok.com/@genelo_tz",
            ],
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "@id": `${SITE}/founder#photo`,
          contentUrl: PHOTO,
          url: PHOTO,
          name: "Genelo Moses Mwazembe",
          caption: "Genelo Moses Mwazembe — Founder & CEO of GNLTECH and creator of Genelo AI",
          description: DESC,
          about: { "@id": `${SITE}/founder#person` },
          creditText: "GNLTECH",
          copyrightNotice: "© GNLTECH",
          creator: { "@type": "Organization", name: "GNLTECH" },
          license: `${SITE}/founder`,
          acquireLicensePage: `${SITE}/contact`,
        }),
      },
    ],
  }),
  component: FounderPage,
});

function FounderPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-foreground">
      <nav className="mb-8 text-sm">
        <Link to="/about" className="text-primary hover:underline">← About Genelo AI & GNLTECH</Link>
      </nav>
      <h1 className="text-4xl font-bold tracking-tight">Genelo Moses Mwazembe</h1>
      <p className="mt-2 text-muted-foreground">Official photo · Founder & CEO of GNLTECH · Creator of Genelo AI</p>
      <figure className="my-8">
        <img
          src={PHOTO}
          alt="Genelo Moses Mwazembe, Tanzanian founder of Genelo AI and GNLTECH"
          width={800}
          height={800}
          className="w-full rounded-2xl border border-border object-cover shadow-sm"
          loading="eager"
        />
        <figcaption className="mt-3 text-sm text-muted-foreground">
          Genelo Moses Mwazembe (aka Dumbile) — Founder & CEO of GNLTECH (GNL Technology), creator of Genelo AI, Genelo Pay and Genelo Shop. Vwawa, Songwe Region, Tanzania.
        </figcaption>
      </figure>
      <p>
        This is the official and only verified photo of Genelo Moses Mwazembe, published by GNLTECH.
        Any other picture presented as him is not him.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <img src={BRAND_LOGO} alt="GNLTECH logo" width={48} height={48} className="rounded-lg border border-border bg-background object-contain p-1" />
        <a href={BRAND_WEBSITE} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GNLTECH — gnltech.wuaze.com ↗</a>
      </div>
    </main>
  );
}
