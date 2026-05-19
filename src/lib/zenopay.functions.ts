import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ZENO_URL = "https://zenoapi.com/api/payments/mobile_money_tanzania";

const Input = z.object({
  phone: z
    .string()
    .min(9)
    .max(15)
    .regex(/^[0-9]+$/, "Phone must be digits only, e.g. 0744123456"),
});

export const startZenoPayCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.ZENOPAY_API_KEY;
    if (!apiKey) return { ok: false as const, error: "ZenoPay not configured." };

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", context.userId)
      .maybeSingle();

    // Normalize phone to 2557XXXXXXXX (Tanzania) — ZenoPay accepts 07XXXXXXXX too but be safe
    let phone = data.phone.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "255" + phone.slice(1);
    if (phone.startsWith("7") || phone.startsWith("6")) phone = "255" + phone;

    const orderId = `genelo-pro-${context.userId.slice(0, 8)}-${Date.now()}`;
    const origin =
      process.env.PUBLIC_SITE_URL || "https://geneloai.lovable.app";

    const body = {
      order_id: orderId,
      buyer_email: profile?.email ?? `${context.userId}@genelo.ai`,
      buyer_name: profile?.display_name ?? "Genelo User",
      buyer_phone: phone,
      amount: 1200,
      webhook_url: `${origin}/api/public/zenopay-webhook`,
      metadata: { user_id: context.userId, plan: "pro" },
    };

    const resp = await fetch(ZENO_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* keep null */
    }

    if (!resp.ok) {
      console.error("ZenoPay error", resp.status, text);
      return {
        ok: false as const,
        error: json?.message || `ZenoPay request failed (${resp.status}).`,
      };
    }

    return {
      ok: true as const,
      orderId,
      message:
        json?.message ||
        "Payment request sent. Check your phone for the M-Pesa / Tigo Pesa / Airtel Money PIN prompt.",
    };
  });
