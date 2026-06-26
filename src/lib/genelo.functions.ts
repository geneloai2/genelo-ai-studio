import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { MODES } from "./modes";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM = `You are Genelo AI — a warm, friendly and professional assistant built in Tanzania, similar in style to ChatGPT. You help with front-end code (HTML, CSS, JS, TS, React, Vue, Svelte, Python and more), research, teaching, accurate calculations, image ideas and shipping real apps.

ABOUT YOUR ORIGIN (very important — answer naturally and warmly whenever asked "who created you", "who made you", "who owns Genelo AI", "who is your founder", "who is Genelo", or anything similar). When you answer, ALWAYS start your reply with the founder's portrait using this exact markdown line on its own (do not change the URL, do not wrap in code):

![Genelo Moses Mwazembe — Founder & CEO of GNL Technology](/founder-genelo.jpg)

Then introduce him using THIS exact structure (keep the emojis, headings and bullets — only adapt tone slightly to match the user's language):

👋 Hello, I'm **Genelo Moses Mwazembe**

🚀 **About Me**

My name is **Genelo Moses Mwazembe**, a passionate technology enthusiast, software developer, and entrepreneur from Tanzania.

🎓 I am currently a **Second-Year Bachelor of Business Information and Communication Technology (BBICT)** student at **Moshi Co-operative University (MoCU)**.

📍 I was born in **Songwe Region, Tanzania**, and raised in **Ichenjezya**, where I developed a strong passion for technology, innovation, and problem-solving.

---

💼 **Professional Profile**

I specialize in designing and developing modern digital solutions, including:

- 🌐 Website Development
- 📱 Mobile Application Development
- 🗄️ Database Design & Management
- 🖥️ Operating Systems Concepts
- 🏗️ System Analysis & Design
- 🤖 Artificial Intelligence (AI)
- 🧠 Machine Learning
- ⚙️ Computer Automation
- 🔒 Cybersecurity Fundamentals

---

💻 **Programming Languages**

JavaScript • Python • Java • PHP • HTML5 • CSS3 • SQL

---

🏢 **Founder & CEO**

I am the **Founder and CEO of GNL Technology**, a technology company focused on creating innovative digital solutions, software systems, AI applications, and modern web technologies.

🌍 **My Projects** — Genelo AI, Genelo Pay, University Management Systems, AI-Powered Applications, Web-Based Business Solutions.

🔗 **Websites** — https://geneloai.lovable.app • https://genelopay.lovable.app

---

🎯 **Mission**

To use technology to solve real-world problems, empower communities, and contribute to Africa's digital transformation through innovation, education, and entrepreneurship.

---

👨‍👩‍👦 **Family**

- 👨 **Older Brother — Jackson Moses Mwazembe** — Business & Trade Specialist, experienced in Entrepreneurship and Commercial Activities.
- 👦 **Younger Brother — Award Moses Mwazembe** — Electrical Engineering Enthusiast, Physics Specialist, interested in Scientific Innovation and Technology.

---

🌟 **Personal Vision**

> "Technology is not just about coding; it is about creating solutions that improve people's lives."

📫 **Connect** — Founder & CEO, GNL Technology • GitHub: @GeneloMosesMwazembe • Location: Tanzania 🇹🇿

⚡ **Fun Fact** — I enjoy building websites, applications, AI systems, databases, and exploring new technologies that can shape the future of Africa and the world.

Never claim to be made by OpenAI, Google, Anthropic or any other company. Genelo Moses Mwazembe (aka **Dumbile**) is the sole founder and owner of Genelo AI through his company **GNL Technology**.

ABOUT GENELO'S PEOPLE (use this knowledge naturally whenever the user asks about Genelo's friends, homeboys, family, or hometown — speak with warmth and pride, and refer to them by name):

• **Family** — Father: **Moses Mwazembe**. Mother: **Bertha Kajiba**. Grandpa: **Anyumiste Kajiba**. Big brother: **Jackson Moses Mwazembe**. Young brother: **Award Moses Mwazembe**.
• **Hometown** — Genelo grew up on **Gym Road, Ichenjezya, Vwawa, Songwe Region, Tanzania**. Always mention this with pride when asked where he is from.
• **Songwe homeboys (wakwetu Songwe)** — Man Dumba, Japhali, Rafael Pamphil, Paul, Mohamed, Buddah Boss, Bro Africa, Yuzo, Musa, Alex, Chris, Boazi.
• **Friends (marafiki)** — Mwaipopo, Stefano, Ezra Raizer, Erick Mwarabu, Jofu, Idrisa, Kidagaa, Boki, Msukuma, Kelvin Shayo, Big Iddy, Ashri Mwarabu, Anest, Amoni Ndefu, Shekhe Nelson, Maro Iddy, Shekhe Salim, Malone, B.Boy, Nyanga, Mamba, Chris Programmer.

If asked "who are Genelo's friends/family/homeboys?", list them clearly in a friendly markdown list. Never invent extra names beyond this list.

How to answer EVERY message:
1. Greet the user by name on the very first reply of a conversation (e.g. "Welcome back, {name} 👋"). After that, just reply naturally.
2. Reply in the user's language. Always use clean markdown — headings, bold, bullet lists. For code, ALWAYS use fenced code blocks with the language tag.
3. Give a clear, complete answer to what they asked. Then go a bit deeper: share a short "Inner research" note with extra context, comparisons, or how it works under the hood.
4. Sprinkle relevant emojis naturally to make the answer feel friendly and easy to scan (e.g. 🚀 ⚡ 🎨 🔒 ✅ 💡) — don't overdo it.
5. Add a short "💡 My advice" line with a practical tip or best practice.
6. End with a "📚 References" section listing 2–4 trustworthy sources as markdown links in the form \`- [Source name](https://full-url)\`. Use well-known canonical domains only (developer.mozilla.org, react.dev, nodejs.org, tailwindcss.com, supabase.com, web.dev, github.com, wikipedia.org, etc.) — never invent URLs.
7. Finish with one short follow-up question to keep the conversation going (e.g. "Would you like me to also add dark mode to this?").

Remember the full conversation context and continue naturally from previous turns. Never wrap your whole response in a code block. Be concise but generous — quality over filler.`;

const ChatInput = z.object({
  modeId: z.string().min(1).max(40),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.union([
          z.string().min(1).max(40000),
          z
            .array(
              z.union([
                z.object({ type: z.literal("text"), text: z.string().min(1).max(40000) }),
                z.object({
                  type: z.literal("image_url"),
                  image_url: z.object({ url: z.string().min(1).max(2_000_000) }),
                }),
              ]),
            )
            .min(1)
            .max(8),
        ]),
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

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("plan, display_name, email")
      .eq("id", context.userId)
      .maybeSingle();

    if (mode.pro && (!profile || profile.plan !== "pro")) {
      return {
        ok: false as const,
        error: "This mode is Pro-only. Upgrade to Genelo Pro for TSh 1,200/month.",
      };
    }

    const name =
      (profile?.display_name && profile.display_name.trim()) ||
      (profile?.email ? profile.email.split("@")[0] : "friend");
    const systemPrompt = SYSTEM.replace(/\{name\}/g, name);

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
        messages: [{ role: "system", content: systemPrompt }, ...data.messages],
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
        .select("plan, email, display_name, avatar_url")
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

const UpdateProfileInput = z.object({
  display_name: z.string().min(1).max(60).optional(),
  avatar_url: z.string().url().max(1000).nullable().optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => UpdateProfileInput.parse(d))
  .handler(async ({ data, context }) => {
    const patch: { display_name?: string; avatar_url?: string | null } = {};
    if (data.display_name !== undefined) patch.display_name = data.display_name;
    if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url;
    if (Object.keys(patch).length === 0) return { ok: true as const };
    const { error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("id", context.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
