// Flutterwave v4 — OAuth client_credentials → create hosted payment session.
// Returns a redirect URL the browser sends the user to in order to pay.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const IDP_URL =
  "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token";
const API_BASE = "https://api.flutterwave.cloud/f4bexperience";

async function getAccessToken() {
  const id = process.env.FLUTTERWAVE_CLIENT_ID;
  const secret = process.env.FLUTTERWAVE_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Flutterwave credentials missing.");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: id,
    client_secret: secret,
  });
  const r = await fetch(IDP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) {
    const t = await r.text();
    console.error("Flutterwave token error", r.status, t);
    throw new Error("Could not authenticate with Flutterwave.");
  }
  const j = (await r.json()) as { access_token: string };
  return j.access_token;
}

export const startProCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", context.userId)
      .maybeSingle();

    const email = profile?.email ?? "user@genelo.ai";
    const name = profile?.display_name ?? "Genelo User";

    let token: string;
    try {
      token = await getAccessToken();
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }

    const reference = `genelo-pro-${context.userId.slice(0, 8)}-${Date.now()}`;
    const origin =
      process.env.VITE_PUBLIC_APP_URL ??
      process.env.PUBLIC_APP_URL ??
      "https://geneloai.lovable.app";

    const payload = {
      reference,
      currency: "TZS",
      amount: 1200,
      customer: { email, name },
      redirect_url: `${origin}/pricing?fw_ref=${reference}`,
      meta: { user_id: context.userId, plan: "pro" },
      payment_method_types: ["card", "mobile_money_tanzania", "bank_transfer"],
    };

    const r = await fetch(`${API_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Trace-Id": reference,
        "X-Idempotency-Key": reference,
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("Flutterwave create payment error", r.status, t);
      return { ok: false as const, error: "Could not start checkout." };
    }
    const j = (await r.json()) as {
      data?: { next_action?: { redirect_url?: string }; link?: string };
    };
    const url =
      j.data?.next_action?.redirect_url ?? j.data?.link ?? null;
    if (!url) {
      console.error("Flutterwave: no checkout url in response", j);
      return { ok: false as const, error: "No checkout URL returned." };
    }
    return { ok: true as const, url };
  });
