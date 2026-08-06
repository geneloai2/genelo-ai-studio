import { createFileRoute, Link } from "@tanstack/react-router";
import founderAsset from "@/assets/founder-genelo.jpg.asset.json";
import { AdSenseUnit } from "@/components/AdSense";
import { Download } from "lucide-react";

const FOUNDER_IMAGE = `https://geneloai.lovable.app${founderAsset.url}`;
const APK_DOWNLOAD_URL =
  "https://drive.google.com/uc?export=download&id=1PHL7ek6zEwz0rY21PfztwdI1IRGpBTfW";
const AD_SLOT = import.meta.env.VITE_ADSENSE_SLOT_ID as string | undefined;


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
          alternateName: ["Genelo", "Dumbile", "Genelo Mwazembe", "Genelo Moses"],
          jobTitle: "Founder & CEO, GNL Technology",
          worksFor: {
            "@type": "Organization",
            name: "GNL Technology",
            url: "https://geneloai.lovable.app",
          },
          affiliation: {
            "@type": "CollegeOrUniversity",
            name: "Moshi Co-operative University (MoCU)",
          },
          alumniOf: {
            "@type": "CollegeOrUniversity",
            name: "Moshi Co-operative University (MoCU)",
          },
          url: "https://geneloai.lovable.app/about",
          mainEntityOfPage: "https://geneloai.lovable.app/about",
          image: FOUNDER_IMAGE,
          nationality: "Tanzanian",
          gender: "Male",
          birthPlace: {
            "@type": "Place",
            name: "Songwe Region, Tanzania",
          },
          homeLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Gym Road, Ichenjezya",
              addressLocality: "Vwawa",
              addressRegion: "Songwe Region",
              addressCountry: "Tanzania",
            },
          },
          knowsAbout: [
            "Artificial Intelligence",
            "Machine Learning",
            "Web Development",
            "Mobile Application Development",
            "Database Design",
            "System Analysis and Design",
            "Cybersecurity",
            "Computer Automation",
            "JavaScript",
            "Python",
            "Java",
            "PHP",
            "HTML5",
            "CSS3",
            "SQL",
          ],
          knowsLanguage: ["English", "Swahili"],
          description:
            "Genelo Moses Mwazembe (aka Dumbile) is a Tanzanian software developer, AI engineer and entrepreneur. He is the Founder and CEO of GNL Technology, the company behind Genelo AI and Genelo Pay. He is a second-year Bachelor of Business Information and Communication Technology (BBICT) student at Moshi Co-operative University (MoCU), born in Songwe Region and raised in Ichenjezya, Tanzania.",
          owns: [
            { "@type": "Organization", name: "GNL Technology" },
            { "@type": "WebSite", name: "Genelo AI", url: "https://geneloai.lovable.app" },
            { "@type": "WebSite", name: "Genelo Pay", url: "https://genelopay.lovable.app" },
          ],
          sibling: [
            { "@type": "Person", name: "Jackson Moses Mwazembe" },
            { "@type": "Person", name: "Award Moses Mwazembe" },
          ],
          parent: [
            { "@type": "Person", name: "Moses Mwazembe" },
            { "@type": "Person", name: "Bertha Kajiba" },
          ],
          sameAs: [
            "https://geneloai.lovable.app",
            "https://genelopay.lovable.app",
            "https://www.tiktok.com/@genelo_tz",
            "https://www.tiktok.com/@softwareengineer010",
            "https://www.facebook.com/genelo.tz",
            "https://github.com/GeneloMosesMwazembe",
          ],
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
        <div className="my-6 flex justify-center">
          <img
            src={FOUNDER_IMAGE}
            alt="Genelo Moses Mwazembe — founder and owner of Genelo AI"
            width={400}
            height={400}
            className="rounded-2xl border border-border object-cover shadow-sm"
            loading="eager"
          />
        </div>
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

        <h2 className="mt-10 text-2xl font-semibold">Get the Android app</h2>
        <p>
          Install Genelo AI on your Android phone as an APK — no Play Store
          needed.
        </p>
        <a
          href={APK_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Download Genelo AI APK
        </a>

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
