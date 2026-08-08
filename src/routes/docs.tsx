import { createFileRoute, Link } from "@tanstack/react-router";
import { AdSenseUnit } from "@/components/AdSense";
import logoAsset from "@/assets/genelo-ai-logo.png.asset.json";

const SITE_ORIGIN = "https://geneloai.lovable.app";
const LOGO_IMAGE = `${SITE_ORIGIN}${logoAsset.url}`;
const AD_SLOT = import.meta.env.VITE_ADSENSE_SLOT_ID as string | undefined;

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
      { property: "og:url", content: `${SITE_ORIGIN}/docs` },
      { property: "og:image", content: LOGO_IMAGE },
      { name: "twitter:image", content: LOGO_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/docs` }],
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

      <AdSenseUnit slot={AD_SLOT} format="auto" />

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-semibold">Getting started</h2>
        <p>
          Open the home page and start typing in the chat box. You do not need
          to sign in to try Genelo AI, but signing in with Google unlocks chat
          history, saved conversations and higher daily limits.
        </p>
        <p>
          On mobile, you can also install the Genelo AI Android APK for a
          native-like experience. The APK download link is available on the home
          page and About page.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-semibold">Modes</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Gn 2.0:</strong> balanced everyday chat with 3 free image
            generations per day.
          </li>
          <li>
            <strong>Gn 3.5:</strong> stronger reasoning and coding help with 10
            free images per day.
          </li>
          <li>
            <strong>Gn Flash:</strong> fastest responses for quick questions
            and brainstorming.
          </li>
          <li>
            <strong>Gn Pro:</strong> top-tier reasoning, unlimited image
            generation and priority responses for paid users.
          </li>
        </ul>
      </section>

      <AdSenseUnit slot={AD_SLOT} format="auto" />

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-semibold">Coding help</h2>
        <p>
          Ask Genelo AI to write, explain or debug code in any front-end
          language. The assistant supports HTML, CSS, JavaScript, TypeScript,
          React, Vue, Tailwind CSS and more. Code blocks include syntax
          highlighting and a one-click copy button.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-semibold">Image generation</h2>
        <p>
          Switch to image mode and describe what you want to create. Free
          accounts receive a daily image limit that resets every 24 hours. Pro
          users can generate unlimited images.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-semibold">Pricing and payments</h2>
        <p>
          Genelo AI Pro costs TSh 1,200 per month. You can pay with mobile
          money through ZenoPay (M-Pesa, Tigo, Airtel, Halotel) or with card
          and bank transfer through Flutterwave. Visit the{" "}
          <Link to="/pricing" className="text-primary hover:underline">pricing page</Link>{" "}
          to upgrade.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-semibold">Support</h2>
        <p>
          For help, email{" "}
          <a href="mailto:support@geneloai.com" className="text-primary hover:underline">support@geneloai.com</a>{" "}
          or WhatsApp{" "}
          <a href="tel:+255621673848" className="text-primary hover:underline">+255 621 673 848</a>.
        </p>
      </section>
    </main>
  );
}
