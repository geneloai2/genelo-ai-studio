import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Check, Crown, Loader2 } from "lucide-react";
import { MODES } from "@/lib/modes";
import { startProCheckout } from "@/lib/flutterwave.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Genelo AI" },
      { name: "description", content: "Genelo AI plans. Free with daily limits or Pro for TSh 1,200 / month." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const startCheckout = useServerFn(startProCheckout);
  const [loading, setLoading] = useState(false);

  async function upgrade() {
    setLoading(true);
    try {
      const res = await startCheckout();
      if (res.ok) window.location.href = res.url;
      else toast.error(res.error ?? "Could not start checkout.");
    } catch {
      toast.error("Checkout failed. Please sign in and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold">Genelo AI</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back to chat
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight">Simple, fair pricing</h1>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade when you need more.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Card title="Free" price="TSh 0" tag="Forever">
            <Feat>Gn 2.0 — 3 images / day</Feat>
            <Feat>Gn 3.5 — 10 images / day</Feat>
            <Feat>Unlimited chat, code, research</Feat>
            <Feat>Q&A and calculations</Feat>
          </Card>
          <Card
            title="Pro"
            price="TSh 1,200"
            tag="per month"
            highlight
          >
            <Feat>Everything in Free</Feat>
            <Feat>Gn Flash 6 — super speed</Feat>
            <Feat>Gn Pro — top-tier reasoning</Feat>
            <Feat>Unlimited image generation</Feat>
            <Feat>Priority responses</Feat>
            <button className="mt-5 w-full rounded-xl bg-foreground py-2.5 text-sm font-medium text-background">
              Upgrade to Pro
            </button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Payment checkout coming soon.
            </p>
          </Card>
        </div>

        <div className="mt-16">
          <h2 className="text-center text-2xl font-semibold">Compare modes</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Daily image limit</th>
                </tr>
              </thead>
              <tbody>
                {MODES.map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.pro ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-genelo-soft px-2 py-0.5 text-[11px] font-medium text-genelo">
                          <Crown className="h-3 w-3" /> Pro
                        </span>
                      ) : (
                        "Free"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.imageLimit >= 9999 ? "Unlimited" : `${m.imageLimit} images / day`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function Card({
  title,
  price,
  tag,
  highlight,
  children,
}: {
  title: string;
  price: string;
  tag: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlight ? "border-foreground bg-card shadow-lg" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {highlight && (
          <span className="inline-flex items-center gap-1 rounded-full bg-genelo-soft px-2 py-1 text-[11px] font-medium text-genelo">
            <Crown className="h-3 w-3" /> Best value
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight">{price}</span>
        <span className="text-sm text-muted-foreground">{tag}</span>
      </div>
      <ul className="mt-5 space-y-2">{children}</ul>
    </div>
  );
}

function Feat({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <Check className="mt-0.5 h-4 w-4 text-genelo" />
      <span>{children}</span>
    </li>
  );
}
