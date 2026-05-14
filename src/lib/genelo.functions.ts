import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { MODES } from "./modes";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM = `You are Genelo AI — a warm, friendly and professional assistant built in Tanzania, similar in style to ChatGPT. You help with front-end code (HTML, CSS, JS, TS, React, Vue, Svelte, Python and more), research, teaching, accurate calculations, image ideas and shipping real apps.

How to answer EVERY message:
1. Greet the user by name on the very first reply of a conversation (e.g. "Welcome back, {name} 👋"). After that, just reply naturally.
2. Reply in the user's language. Always use clean markdown — headings, bold, bullet lists. For code, ALWAYS use fenced code blocks with the language tag.
3. Give a clear, complete answer to what they asked. Then go a bit deeper: share a short "Inner research" note with extra context, comparisons, or how it works under the hood.
4. Add a short "💡 My advice" line with a practical tip or best practice.
5. End with a "References" section listing 2–4 trustworthy sources (MDN, official docs, well-known articles) as plain links — do not invent URLs you are not sure exist; prefer well-known canonical ones (developer.mozilla.org, react.dev, nodejs.org, tailwindcss.com, supabase.com, etc.).
6. Finish with one short follow-up question to keep the conversation going (e.g. "Would you like me to also add dark mode to this?").

Remember the full conversation context and continue naturally from previous turns. Never wrap your whole response in a code block. Be concise but generous — quality over filler.`;

const ChatInput = z.object({
  modeId: z.string().min(1).max(40),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(20000),
      }),
    )
    .min(1)
    .max(40),
});

export const chatWithGenelo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ChatInput.parse(d))
  .handler(async ({ data, context }) => {
    const mode = MODES.find((m) => m.id === data.modeId) ?? MODES[0];

    // Gate Pro modes
    if (mode.pro) {
      const { data: profile } = await context.supabase
        .from("profiles")
        .select("plan")
        .eq("id", context.userId)
        .maybeSingle();
      if (!profile || profile.plan !== "pro") {
        return {
          ok: false as const,
          error: "This mode is Pro-only. Upgrade to Genelo Pro for TSh 1,200/month.",
        };
      }
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false as const, error: "AI not configured." };

    const resp = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: mode.model,
        messages: [{ role: "system", content: SYSTEM }, ...data.messages],
      }),
    });

    if (resp.status === 429)
      return { ok: false as const, error: "Rate limit hit, please slow down." };
    if (resp.status === 402)
      return {
        ok: false as const,
        error: "AI credits exhausted. Please add credits in workspace settings.",
      };
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI error", resp.status, t);
      return { ok: false as const, error: "AI request failed." };
    }
    const j = await resp.json();
    const content: string = j.choices?.[0]?.message?.content ?? "";
    return { ok: true as const, content };
  });

const ImageInput = z.object({
  modeId: z.string().min(1).max(40),
  prompt: z.string().min(1).max(2000),
});

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ImageInput.parse(d))
  .handler(async ({ data, context }) => {
    const mode = MODES.find((m) => m.id === data.modeId) ?? MODES[0];

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("plan")
      .eq("id", context.userId)
      .maybeSingle();
    const isPro = profile?.plan === "pro";

    // Quota check (skip for pro)
    if (!isPro) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: usage } = await supabaseAdmin
        .from("image_usage")
        .select("count")
        .eq("user_id", context.userId)
        .eq("mode", data.modeId)
        .eq("day", today)
        .maybeSingle();
      const used = usage?.count ?? 0;
      if (used >= mode.imageLimit) {
        return {
          ok: false as const,
          error: `Daily limit reached for ${mode.name} (${mode.imageLimit} images/day). Upgrade to Pro for unlimited.`,
        };
      }
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false as const, error: "AI not configured." };

    const resp = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: data.prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (resp.status === 429)
      return { ok: false as const, error: "Rate limit hit, slow down." };
    if (resp.status === 402)
      return { ok: false as const, error: "AI credits exhausted." };
    if (!resp.ok) {
      const t = await resp.text();
      console.error("Image error", resp.status, t);
      return { ok: false as const, error: "Image generation failed." };
    }
    const j = await resp.json();
    const url: string | undefined =
      j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) return { ok: false as const, error: "No image returned." };

    // Increment usage
    if (!isPro) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await supabaseAdmin
        .from("image_usage")
        .select("id, count")
        .eq("user_id", context.userId)
        .eq("mode", data.modeId)
        .eq("day", today)
        .maybeSingle();
      if (existing) {
        await supabaseAdmin
          .from("image_usage")
          .update({ count: existing.count + 1 })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("image_usage").insert({
          user_id: context.userId,
          mode: data.modeId,
          day: today,
          count: 1,
        });
      }
    }

    return { ok: true as const, url };
  });

export const getProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: profile }, { data: usage }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("plan, email")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("image_usage")
        .select("mode, count")
        .eq("user_id", context.userId)
        .eq("day", today),
    ]);
    return { profile, usage: usage ?? [] };
  });
