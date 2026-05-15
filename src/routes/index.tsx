import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { type ModeId, getMode } from "@/lib/modes";
import { Markdown } from "@/components/Markdown";
import { chatWithGenelo, generateImage, getProfile } from "@/lib/genelo.functions";
import { checkAdmin } from "@/lib/admin.functions";
import { saveChat, getChat, listChats, deleteChat } from "@/lib/chats.functions";
import {
  Sparkles,
  Send,
  Image as ImageIcon,
  Loader2,
  Shield,
  Settings as SettingsIcon,
  Plus,
  Menu,
  X,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({
    chat: typeof s.chat === "string" ? s.chat : undefined,
  }),
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
type Profile = { plan: string; display_name?: string | null; avatar_url?: string | null; email?: string | null };

function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/" }) as { chat?: string };
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [imgMode, setImgMode] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Saved AI mode (persisted in localStorage; chosen in Settings)
  const [mode] = useState<ModeId>(() => {
    if (typeof window === "undefined") return "gn35";
    return ((localStorage.getItem("genelo-mode") as ModeId) || "gn35") as ModeId;
  });

  const chatFn = useServerFn(chatWithGenelo);
  const imgFn = useServerFn(generateImage);
  const profileFn = useServerFn(getProfile);
  const adminCheckFn = useServerFn(checkAdmin);
  const saveFn = useServerFn(saveChat);
  const getChatFn = useServerFn(getChat);
  const listChatsFn = useServerFn(listChats);
  const deleteChatFn = useServerFn(deleteChat);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    profileFn()
      .then((r) => setProfile((r.profile as Profile) ?? { plan: "free" }))
      .catch(() => setProfile({ plan: "free" }));
    adminCheckFn()
      .then((r) => setIsAdmin(r.isAdmin))
      .catch(() => setIsAdmin(false));
  }, [user, profileFn, adminCheckFn]);

  // Load chat list (for sidebar)
  function refreshChats() {
    listChatsFn()
      .then((r) => setChats(r?.chats ?? []))
      .catch(() => setChats([]));
  }
  useEffect(() => {
    if (user) refreshChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load chat from ?chat=
  useEffect(() => {
    if (!user || !search.chat) return;
    getChatFn({ data: { id: search.chat } })
      .then((r) => {
        if (r.chat) {
          setChatId(r.chat.id);
          setMessages((r.chat.messages as Msg[]) ?? []);
          setSidebarOpen(false);
        }
      })
      .catch(() => {});
  }, [user, search.chat, getChatFn]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [messages, busy]);

  const displayName =
    (profile?.display_name && profile.display_name.trim()) ||
    (profile?.email ? profile.email.split("@")[0] : user?.email?.split("@")[0] ?? "friend");

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

      try {
        const r = await saveFn({
          data: {
            id: chatId,
            title: chatId ? "Chat" : text.slice(0, 60) || "New chat",
            messages: finalMessages as any,
          },
        });
        if (!chatId) setChatId(r.id);
        refreshChats();
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

  async function removeChat(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;
    await deleteChatFn({ data: { id } });
    setChats((c) => c.filter((x) => x.id !== id));
    if (chatId === id) {
      setChatId(undefined);
      setMessages([]);
      navigate({ to: "/", search: {} as any });
    }
    toast.success("Chat deleted");
  }

  function newChat() {
    setChatId(undefined);
    setMessages([]);
    setSidebarOpen(false);
    navigate({ to: "/", search: {} as any });
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

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 transform border-r border-border bg-background transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Chat history</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-3 py-3">
          <button
            onClick={newChat}
            className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <Plus className="h-4 w-4" /> New chat
          </button>
        </div>
        <div className="h-[calc(100vh-9rem)] overflow-y-auto px-2 pb-4">
          {chats.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No chats yet. Start a conversation!
            </div>
          ) : (
            <ul className="space-y-1">
              {chats.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/"
                    search={{ chat: c.id } as any}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted ${
                      chatId === c.id ? "bg-muted" : ""
                    }`}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate">{c.title}</span>
                    </span>
                    <button
                      onClick={(e) => removeChat(c.id, e)}
                      className="rounded p-1 text-muted-foreground opacity-0 hover:bg-background hover:text-destructive group-hover:opacity-100"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted"
              aria-label="Open chat history"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">Genelo AI</div>
                <div className="text-[11px] text-muted-foreground">{currentMode.name}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                <Shield className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
            <button
              onClick={newChat}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              aria-label="New chat"
              title="New chat"
            >
              <Plus className="h-4 w-4" />
            </button>
            <Link
              to="/settings"
              className="rounded-full p-1 hover:opacity-80"
              aria-label="Settings"
              title="Settings"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="h-8 w-8 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-foreground">
                  {displayName.slice(0, 1)}
                </div>
              )}
            </Link>
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
      </header>

      {/* Messages */}
      <main ref={scrollRef} className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <Welcome name={displayName} />
        ) : (
          <div className="space-y-8">
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
        <div className="mx-auto max-w-3xl px-4 py-3">
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
                  : "Ask Genelo anything — code, research, advice…"
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
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }
  if (isUser) {
    return (
      <div className="group flex justify-end">
        <div className="relative max-w-[85%] rounded-2xl bg-foreground px-4 py-3 text-background">
          <p className="whitespace-pre-wrap pr-6 text-sm">{msg.content}</p>
          <button
            onClick={copy}
            className="absolute -left-9 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
            aria-label="Copy your message"
            title="Copy"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    );
  }
  // Assistant: full-width, no box, ChatGPT-style
  return (
    <div className="group flex gap-3">
      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-foreground text-background">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 text-foreground">
        <Markdown content={msg.content} />
        {msg.image && (
          <img
            src={msg.image}
            alt="Generated"
            className="mt-3 max-h-96 rounded-lg border border-border"
          />
        )}
        <div className="mt-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy response"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Welcome({ name }: { name: string }) {
  const examples = [
    "Build a responsive React pricing card with Tailwind",
    "Explain useEffect cleanup with an example",
    "Calculate compound interest for 500,000 at 8% over 5 years",
    "Generate an image of a futuristic Dar es Salaam skyline at sunset",
  ];
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  return (
    <div className="mx-auto max-w-2xl pt-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Welcome back, {capitalized} 👋
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        How can Genelo help you today?
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
