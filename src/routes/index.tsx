import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { MODES, type ModeId, getMode } from "@/lib/modes";
import { ModeSelector } from "@/components/ModeSelector";
import { Markdown } from "@/components/Markdown";
import { chatWithGenelo, generateImage, getProfile } from "@/lib/genelo.functions";
import { checkAdmin } from "@/lib/admin.functions";
import { saveChat, getChat } from "@/lib/chats.functions";
import { Sparkles, Send, Image as ImageIcon, Crown, Loader2, Shield, Settings as SettingsIcon, Plus } from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({ chat: typeof s.chat === "string" ? s.chat : undefined }),
  head: () => ({
    meta: [
      { title: "Genelo AI — Code, research, images, calculations" },
      {
        name: "description",
        content:
          "Genelo AI is your professional assistant for front-end coding in any language, research, teaching, image generation, Q&A and calculations.",
      },
    ],
  }),
  component: HomePage,
});

type Msg = { role: "user" | "assistant"; content: string; image?: string };

function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/" }) as { chat?: string };
  const [mode, setMode] = useState<ModeId>("gn35");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [imgMode, setImgMode] = useState(false);
  const [profile, setProfile] = useState<{ plan: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatFn = useServerFn(chatWithGenelo);
  const imgFn = useServerFn(generateImage);
  const profileFn = useServerFn(getProfile);
  const adminCheckFn = useServerFn(checkAdmin);
  const saveFn = useServerFn(saveChat);
  const getChatFn = useServerFn(getChat);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    profileFn().then((r) => setProfile(r.profile ?? { plan: "free" }));
    adminCheckFn().then((r) => setIsAdmin(r.isAdmin)).catch(() => setIsAdmin(false));
  }, [user, profileFn, adminCheckFn]);

  // Load chat from ?chat=
  useEffect(() => {
    if (!user || !search.chat) return;
    getChatFn({ data: { id: search.chat } }).then((r) => {
      if (r.chat) {
        setChatId(r.chat.id);
        setMessages((r.chat.messages as any) ?? []);
      }
    });
  }, [user, search.chat, getChatFn]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [messages, busy]);

  const isPro = profile?.plan === "pro";

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const userMsg: Msg = { role: "user", content: text };
    const baseMessages = [...messages, userMsg];
    setMessages(baseMessages);
    setInput("");
    setBusy(true);

    let finalMessages = baseMessages;
    try {
      if (imgMode) {
        const r = await imgFn({ data: { modeId: mode, prompt: text } });
        if (!r.ok) {
          toast.error(r.error);
          finalMessages = [...baseMessages, { role: "assistant", content: `⚠️ ${r.error}` }];
        } else {
          finalMessages = [
            ...baseMessages,
            { role: "assistant", content: "Here's your image:", image: r.url },
          ];
        }
        setMessages(finalMessages);
      } else {
        const history = baseMessages.map((x) => ({ role: x.role, content: x.content }));
        const r = await chatFn({ data: { modeId: mode, messages: history } });
        if (!r.ok) {
          toast.error(r.error);
          finalMessages = [...baseMessages, { role: "assistant", content: `⚠️ ${r.error}` }];
        } else {
          finalMessages = [...baseMessages, { role: "assistant", content: r.content }];
        }
        setMessages(finalMessages);
      }

      // Persist chat history
      try {
        const title = (chatId ? undefined : text.slice(0, 60)) ?? "Chat";
        const r = await saveFn({
          data: {
            id: chatId,
            title: chatId ? "Chat" : text.slice(0, 60) || "New chat",
            messages: finalMessages as any,
          },
        });
        if (!chatId) setChatId(r.id);
      } catch (e) {
        console.error("save chat failed", e);
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentMode = getMode(mode);

  return (
    <div className="flex min-h-screen flex-col">
      <Toaster richColors position="top-center" />
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Genelo AI</div>
              <div className="text-[11px] text-muted-foreground">
                {currentMode.name} · {currentMode.tag}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                <Shield className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
            {!isPro && (
              <Link
                to="/pricing"
                className="hidden items-center gap-1 rounded-full bg-genelo-soft px-3 py-1.5 text-xs font-medium text-genelo hover:opacity-90 sm:inline-flex"
              >
                <Crown className="h-3.5 w-3.5" /> Upgrade · TSh 1,200/mo
              </Link>
            )}
            {isPro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">
                <Crown className="h-3.5 w-3.5" /> Pro
              </span>
            )}
            <button
              onClick={() => {
                setChatId(undefined);
                setMessages([]);
                navigate({ to: "/", search: {} as any });
              }}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              aria-label="New chat"
              title="New chat"
            >
              <Plus className="h-4 w-4" />
            </button>
            <Link
              to="/settings"
              className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              aria-label="Settings"
              title="Settings"
            >
              <SettingsIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-3">
          <ModeSelector value={mode} onChange={setMode} isPro={isPro} />
        </div>
      </header>

      {/* Messages */}
      <main ref={scrollRef} className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <Welcome />
        ) : (
          <div className="space-y-6">
            {messages.map((m, i) => (
              <Bubble key={i} msg={m} />
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Genelo is thinking…
              </div>
            )}
          </div>
        )}
      </main>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-border bg-background">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-foreground/40">
            <button
              onClick={() => setImgMode((v) => !v)}
              className={`flex h-9 items-center gap-1 rounded-xl px-3 text-xs font-medium transition-colors ${
                imgMode
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
              title="Toggle image generation"
            >
              <ImageIcon className="h-4 w-4" />
              {imgMode ? "Image" : "Chat"}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={
                imgMode
                  ? "Describe an image to generate…"
                  : "Ask Genelo to code, explain, calculate or research…"
              }
              className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background transition-opacity disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Genelo can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-foreground text-background"
            : "border border-border bg-card text-foreground"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
        ) : (
          <Markdown content={msg.content} />
        )}
        {msg.image && (
          <img
            src={msg.image}
            alt="Generated"
            className="mt-3 max-h-96 rounded-lg border border-border"
          />
        )}
      </div>
    </div>
  );
}

function Welcome() {
  const examples = [
    "Build a responsive React pricing card with Tailwind",
    "Explain useEffect cleanup with an example",
    "Calculate the compound interest for 500,000 at 8% over 5 years",
    "Generate an image of a futuristic Dar es Salaam skyline at sunset",
  ];
  return (
    <div className="mx-auto max-w-2xl pt-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        How can Genelo help you today?
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Front-end code in any language, research, teaching, images, Q&A and calculations.
      </p>
      <div className="mt-8 grid gap-2 text-left sm:grid-cols-2">
        {examples.map((e) => (
          <div
            key={e}
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
          >
            {e}
          </div>
        ))}
      </div>
    </div>
  );
}
