import { createFileRoute, Link } from "@tanstack/react-router";
import founderAsset from "@/assets/founder-genelo.jpg.asset.json";
import logoAsset from "@/assets/genelo-ai-logo.png.asset.json";
import { BRAND_LOGO, BRAND_LOGO_ABSOLUTE, BRAND_WEBSITE } from "@/lib/brand";
import { AdSenseUnit } from "@/components/AdSense";
import { Download } from "lucide-react";

const SITE_ORIGIN = "https://geneloai.lovable.app";
const FOUNDER_IMAGE = `${SITE_ORIGIN}${founderAsset.url}`;
const LOGO_IMAGE = `${SITE_ORIGIN}${logoAsset.url}`;
const APK_DOWNLOAD_URL =
  "https://drive.google.com/uc?export=download&id=1PHL7ek6zEwz0rY21PfztwdI1IRGpBTfW";
const AD_SLOT = import.meta.env.VITE_ADSENSE_SLOT_ID as string | undefined;


export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Genelo AI & GNLTECH — Company, Projects & Founder" },
      {
        name: "description",
        content:
          "Genelo AI is part of GNLTECH, a Tanzanian technology business founded by Genelo Moses Mwazembe. Explore its software services, digital platforms and GNL Environment & Investment agricultural project.",
      },
      { name: "author", content: "Genelo Moses Mwazembe" },
      { property: "og:title", content: "About Genelo AI & GNLTECH — Company, Projects & Founder" },
      {
        property: "og:description",
        content:
          "Discover GNLTECH, the company behind Genelo AI, its digital services, agricultural trading vision and founder Genelo Moses Mwazembe.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: `${SITE_ORIGIN}/about` },
      { property: "og:image", content: FOUNDER_IMAGE },
      { name: "twitter:image", content: FOUNDER_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/about` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": "https://gnltech.wuaze.com/#organization",
          name: "GNLTECH",
          alternateName: ["GNLTECH.COMPANY.LTD", "GNL Technology"],
          url: "https://gnltech.wuaze.com/",
          logo: BRAND_LOGO_ABSOLUTE,
          description: "GNLTECH is a Tanzanian technology-focused business associated with software services and digital platforms including Genelo AI, Genelo Shop and Genelo Pay. Its agricultural project, GNL Environment & Investment, aims to connect farmers and buyers, support crop trading and coordinate distribution using digital tools.",
          founder: { "@type": "Person", name: "Genelo Moses Mwazembe", url: `${SITE_ORIGIN}/about` },
          sameAs: ["https://gnltech.wuaze.com/about.php"],
          subOrganization: { "@type": "Organization", name: "Genelo AI", url: SITE_ORIGIN },
        }),
      },
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
        <div className="mb-8 flex items-center gap-3">
          <img
            src={BRAND_LOGO}
            alt="GNLTECH logo"
            width={56}
            height={56}
            className="rounded-xl border border-border bg-background object-contain p-1 shadow-sm"
            loading="eager"
          />
          <div>
            <h1 className="m-0 text-4xl font-bold tracking-tight">About Genelo AI</h1>
            <p className="m-0 mt-1 text-sm text-muted-foreground">Genelo AI by GNLTECH · Tanzania</p>
          </div>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Genelo AI is an AI assistant for coding, research, image generation
          and everyday questions — founded and built by{" "}
          <strong>Genelo Moses Mwazembe</strong>.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">About GNLTECH</h2>
        <a href={BRAND_WEBSITE} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          gnltech.wuaze.com ↗
        </a>
        <p>
          GNLTECH (GNLTECH.COMPANY.LTD), also known as GNL Technology, is our
          Tanzanian technology-focused business behind Genelo AI. Its work brings
          together software development, digital systems and practical services
          for agriculture, business and everyday life.
        </p>
        <p>
          Founded by Genelo Moses Mwazembe, GNLTECH aims to simplify business
          activities, support agricultural trade and make useful technology more
          accessible to communities. Its digital ecosystem includes Genelo AI
          for AI assistance, Genelo Shop for online shopping and Genelo Pay for
          digital payment-related services. Payment features depend on supported
          services and actual deployment.
        </p>
        <h3 className="mt-6 text-xl font-semibold">GNL Environment &amp; Investment</h3>
        <p>
          GNL Environment &amp; Investment is GNLTECH’s agricultural project,
          established on 20 June 2026 according to its official company About
          page. It aims to connect farmers and buyers, make crop trading easier,
          open market opportunities and coordinate the distribution of
          agricultural goods. Digital tools support communication, transaction
          records and more efficient business processes.
        </p>
        <p>
          Its long-term market vision includes Tanzania, Kenya, Uganda, Zambia,
          Rwanda and Burundi. Product and service availability depends on
          operational capacity, delivery coverage and the requirements in each
          country. The company’s vision is a transparent agricultural trading
          network that helps farmers reach buyers and creates useful
          opportunities for communities across Africa.
        </p>
        <h3 className="mt-6 text-xl font-semibold">Technology and services</h3>
        <p>
          GNLTECH’s stated software technologies include HTML, CSS, JavaScript,
          PHP and SQL. Its listed services include NextSMS for messaging, Brevo
          for email and ClickPesa for payments, where configured or enabled.
          Listing a provider does not confirm that an integration is live.
        </p>
        <p>
          Company information is drawn from the{" "}
          <a href="https://gnltech.wuaze.com/about.php" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            official GNLTECH About page
          </a>.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Who is Genelo Moses Mwazembe?</h2>
        <div className="my-6 grid gap-4 sm:grid-cols-2">
          <img
            src={FOUNDER_IMAGE}
            alt="Genelo Moses Mwazembe — founder and owner of Genelo AI"
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
        <p>
          Our goal is to lower the barrier to learning and building with AI.
          Whether you are a student in Vwawa, a developer in Dar es Salaam,
          or a researcher anywhere in the world, Genelo AI is built to help you
          turn ideas into working products.
        </p>

        <AdSenseUnit slot={AD_SLOT} format="auto" />

        <h2 className="mt-10 text-2xl font-semibold">Education</h2>
        <p>
          Genelo is a second-year student pursuing a Bachelor of Business in
          Information and Communication Technology (BBICT) at Moshi
          Co-operative University (MoCU), Department of Computer Science. His
          studies cover software engineering, database systems, networking,
          cybersecurity and system analysis — all of which shape how Genelo AI
          is designed and built.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Other projects</h2>
        <p>
          Beyond Genelo AI, Genelo is also building{" "}
          <a
            href="https://genelopay.lovable.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Genelo Pay
          </a>{" "}
          for digital payments in Tanzania, and{" "}
          <a
            href="https://geneloshop.lovable.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Genelo Shop
          </a>{" "}
          for online shopping. Together these platforms form GNL Technology,
          a growing technology company focused on practical African digital
          solutions.
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

        <AdSenseUnit slot={AD_SLOT} format="auto" />

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
          </a>{" "}
          or call/WhatsApp{" "}
          <a href="tel:+255621673848" className="text-primary hover:underline">
            +255 621 673 848
          </a>.
        </p>
      </article>
    </main>
  );
}
