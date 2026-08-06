import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Check, Crown, Loader2, Smartphone, CreditCard } from "lucide-react";
import { MODES } from "@/lib/modes";
import { startProCheckout } from "@/lib/flutterwave.functions";
import { startZenoPayCheckout } from "@/lib/zenopay.functions";
import { AdSenseUnit } from "@/components/AdSense";
import { toast } from "sonner";

const AD_SLOT = import.meta.env.VITE_ADSENSE_SLOT_ID as string | undefined;

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
  const startZeno = useServerFn(startZenoPayCheckout);
  const [loading, setLoading] = useState(false);
  const [zenoLoading, setZenoLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"zeno" | "flutter">("zeno");

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

  async function payWithZeno() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      toast.error("Enter a valid Tanzania phone, e.g. 0744123456");
      return;
    }
    setZenoLoading(true);
    try {
      const res = await startZeno({ data: { phone: digits } });
      if (res.ok) {
        toast.success(res.message, { duration: 8000 });
      } else {
        toast.error(res.error ?? "ZenoPay failed.");
      }
    } catch {
      toast.error("ZenoPay request failed. Please try again.");
    } finally {
      setZenoLoading(false);
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

            <div className="mt-5 flex gap-2 rounded-xl bg-muted p-1 text-xs font-medium">
              <button
                onClick={() => setMethod("zeno")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition-colors ${
                  method === "zeno" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Mobile Money
              </button>
              <button
                onClick={() => setMethod("flutter")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition-colors ${
                  method === "flutter" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" /> Card / Bank
              </button>
            </div>

            {method === "zeno" ? (
              <div className="mt-3 space-y-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="07XX XXX XXX (M-Pesa, Tigo, Airtel, Halotel)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-foreground/40"
                />
                <button
                  onClick={payWithZeno}
                  disabled={zenoLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {zenoLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {zenoLoading ? "Sending USSD…" : "Pay TSh 1,200 with Mobile Money"}
                </button>
                <p className="text-center text-[11px] text-muted-foreground">
                  You'll get a PIN prompt on your phone via ZenoPay.
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={upgrade}
                  disabled={loading}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Starting checkout…" : "Pay with Card / Bank"}
                </button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Secure card &amp; bank payment via Flutterwave.
                </p>
              </>
            )}
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
