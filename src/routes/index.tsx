import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { type ModeId, getMode } from "@/lib/modes";
import { Markdown } from "@/components/Markdown";
import { chatWithGenelo, generateImage, getProfile } from "@/lib/genelo.functions";
import { checkAdmin } from "@/lib/admin.functions";
import { saveChat, getChat, listChats, deleteChat } from "@/lib/chats.functions";
import logoAsset from "@/assets/genelo-ai-logo.png.asset.json";
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
  Check,
  Copy,
  Mic,
  MicOff,
  Paperclip,
  Volume2,
  VolumeX,
  FileText,
  Radio,
  Download,
} from "lucide-react";
import { toast, Toaster } from "sonner";

const APK_DOWNLOAD_URL =
  "https://drive.google.com/uc?export=download&id=1PHL7ek6zEwz0rY21PfztwdI1IRGpBTfW";
const LOGO_URL = logoAsset.url;

function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor?.isNativePlatform?.();
}

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => {
    const chat = typeof s.chat === "string" ? s.chat : undefined;
    return chat ? { chat } : {};
  },
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

type Attachment = { name: string; mime: string; dataUrl: string; kind: "image" | "file"; text?: string };
type Msg = { role: "user" | "assistant"; content: string; image?: string; attachments?: Attachment[] };
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [listening, setListening] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [showJump, setShowJump] = useState(false);

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // Guests can start chatting immediately; signed-in users also get saved history and Pro features.

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

  // Simple scroll-to-bottom when messages change (does not fight the user).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // Track whether the user has scrolled up — show a "Jump to latest" button.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowJump(distance > 200);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    return () => el.removeEventListener("scroll", check);
  }, [messages.length, busy]);

  function jumpToLatest() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }



  const displayName =
    (profile?.display_name && profile.display_name.trim()) ||
    (profile?.email ? profile.email.split("@")[0] : user?.email?.split("@")[0] ?? "friend");

  function speak(text: string) {
    if (!speakReplies || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      const plain = text.replace(/```[\s\S]*?```/g, " code block ").replace(/[#*_`>-]/g, "");
      const u = new SpeechSynthesisUtterance(plain.slice(0, 800));
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {/* ignore */}
  }

  function toggleMic() {
    if (typeof window === "undefined") return;
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input not supported in this browser. Try Chrome.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = navigator.language || "en-US";
    r.onresult = (ev: any) => {
      let txt = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
      setInput((prev) => (prev ? prev + " " : "") + txt);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recognitionRef.current = r;
    setListening(true);
    r.start();
  }

  function readFileAsDataURL(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = () => rej(fr.error);
      fr.readAsDataURL(f);
    });
  }
  function readFileAsText(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result || ""));
      fr.onerror = () => rej(fr.error);
      fr.readAsText(f);
    });
  }

  /** Downscale images so the upload always fits the AI request limits. */
  function compressImage(dataUrl: string, max = 1152, quality = 0.8): Promise<string> {
    return new Promise((res) => {
      try {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return res(dataUrl);
          ctx.drawImage(img, 0, 0, w, h);
          res(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => res(dataUrl);
        img.src = dataUrl;
      } catch {
        res(dataUrl);
      }
    });
  }

  async function onPickFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const next: Attachment[] = [];
    for (const f of Array.from(files).slice(0, 4)) {
      if (f.size > 12 * 1024 * 1024) {
        toast.error(`${f.name} is larger than 12MB`);
        continue;
      }
      try {
        const isImage = f.type.startsWith("image/");
        let dataUrl = await readFileAsDataURL(f);
        let text: string | undefined;
        if (isImage) {
          dataUrl = await compressImage(dataUrl);
          if (dataUrl.length > 1_800_000) dataUrl = await compressImage(dataUrl, 800, 0.65);
        } else if (
          f.type.startsWith("text/") ||
          /\.(md|txt|csv|json|js|ts|tsx|jsx|html|css|py|java|php|sql|xml|yml|yaml)$/i.test(f.name)
        ) {
          text = (await readFileAsText(f)).slice(0, 20000);
        } else if (/\.pdf$/i.test(f.name) || f.type === "application/pdf") {
          text = undefined;
        }
        next.push({
          name: f.name,
          mime: f.type || "application/octet-stream",
          dataUrl,
          kind: isImage ? "image" : "file",
          text,
        });
      } catch {
        toast.error(`Could not read ${f.name}`);
      }
    }
    setAttachments((a) => [...a, ...next].slice(0, 4));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }


  async function send(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if ((!text && attachments.length === 0) || busy) return;
    const atts = attachments;
    const userMsg: Msg = { role: "user", content: text || "(see attachment)", attachments: atts.length ? atts : undefined };
    const baseMessages = [...messages, userMsg];
    setMessages(baseMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setAttachments([]);
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
        const history = baseMessages.map((x) => {
          if (x.attachments && x.attachments.length) {
            const parts: any[] = [];
            const fileNotes = x.attachments
              .filter((a) => a.kind === "file")
              .map((a) => `\n\n📎 Attached file: ${a.name}${a.text ? `\n\n\`\`\`\n${a.text}\n\`\`\`` : ""}`)
              .join("");
            parts.push({ type: "text", text: (x.content || "") + fileNotes });
            for (const a of x.attachments) {
              if (a.kind === "image") parts.push({ type: "image_url", image_url: { url: a.dataUrl } });
            }
            return { role: x.role, content: parts };
          }
          return { role: x.role, content: x.content };
        });
        const r = await chatFn({ data: { modeId: mode, messages: history as any } });
        if (!r.ok) {
          toast.error(r.error);
          finalMessages = [...baseMessages, { role: "assistant", content: `⚠️ ${r.error}` }];
        } else {
          finalMessages = [...baseMessages, { role: "assistant", content: r.content }];
          speak(r.content);
        }
        setMessages(finalMessages);
      }

      if (!user) return;
      try {
        // Keep a small thumbnail of uploads so history shows the attached files.
        const toSave = await Promise.all(
          finalMessages.map(async (m) => ({
            role: m.role,
            content: m.content,
            ...(m.image ? { image: m.image } : {}),
            ...(m.attachments && m.attachments.length
              ? {
                  attachments: await Promise.all(
                    m.attachments.map(async (a) => ({
                      name: a.name,
                      mime: a.mime,
                      kind: a.kind,
                      ...(a.kind === "image"
                        ? { dataUrl: await compressImage(a.dataUrl, 320, 0.6) }
                        : {}),
                    })),
                  ),
                }
              : {}),
          })),
        );
        const r = await saveFn({
          data: {
            id: chatId,
            title: chatId ? "Chat" : (text || atts[0]?.name || "New chat").slice(0, 60),
            messages: toSave as any,
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

  if (loading) {
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
            <img
              src={LOGO_URL}
              alt="Genelo AI"
              width={36}
              height={28}
              className="h-7 w-9 rounded-md border-2 border-foreground/80 bg-background object-contain p-0.5 shadow-sm"
              loading="eager"
            />
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
        <div className="mx-auto flex w-full items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted"
              aria-label="Open chat history"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src={LOGO_URL}
                alt="Genelo AI"
                width={44}
                height={36}
                className="h-9 w-11 rounded-lg border-2 border-foreground/80 bg-background object-contain p-0.5 shadow-sm"
                loading="eager"
              />
              <div>
                <div className="text-sm font-semibold leading-tight">Genelo AI</div>
                <div className="text-[11px] text-muted-foreground">{currentMode.name}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isNativeApp() && (
              <a
                href={APK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                aria-label="Download Genelo AI Android APK"
                title="Download Android APK"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Get APK</span>
              </a>
            )}
            {!user ? (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background hover:opacity-90"
              >
                Sign in
              </Link>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </header>


      {/* Messages */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-muted/30">
        <main ref={scrollRef} className="mx-auto w-full flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 md:max-w-3xl">
          {messages.length === 0 ? (
            <Welcome name={displayName} onPick={(t) => send(t)} />
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
        {showJump && (
          <button
            onClick={jumpToLatest}
            className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium shadow-lg hover:bg-muted"
            aria-label="Jump to latest message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M6 9l6 6 6-6"/></svg>
            Jump to latest
          </button>
        )}
      </div>


      {/* Composer */}
      <div className="sticky bottom-0 border-t border-border bg-background">
        <div className="mx-auto w-full px-4 py-3 md:max-w-3xl">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1 text-xs">
                  {a.kind === "image" ? (
                    <img src={a.dataUrl} alt={a.name} className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="max-w-[160px] truncate">{a.name}</span>
                  <button
                    onClick={() => setAttachments((arr) => arr.filter((_, j) => j !== i))}
                    className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                    aria-label="Remove attachment"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-foreground/40">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.html,.css,.py"
              className="hidden"
              onChange={(e) => onPickFiles(e.target.files)}
            />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 240) + "px";
              }}
              onFocus={() =>
                scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" })
              }
              onPaste={(e) => {
                const txt = e.clipboardData.getData("text");
                if (txt && txt.length > 1500) {
                  e.preventDefault();
                  const name = `pasted-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.txt`;
                  const dataUrl = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(txt)));
                  setAttachments((a) =>
                    [...a, { name, mime: "text/plain", dataUrl, kind: "file" as const, text: txt.slice(0, 20000) }].slice(0, 4),
                  );
                  toast.success("Large paste saved as a .txt attachment");
                }
              }}
              onKeyDown={(e) => {
                // On native (APK) or touch devices, let Enter insert a newline.
                // Sending is done via the send button.
                const isNative =
                  typeof window !== "undefined" &&
                  ((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
                    .Capacitor?.isNativePlatform?.() ||
                    window.matchMedia?.("(pointer: coarse)").matches);
                if (e.key === "Enter" && !e.shiftKey && !isNative) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={
                imgMode
                  ? "Describe an image to generate…"
                  : listening
                    ? "Listening…"
                    : "Ask Genelo anything — code, research, advice…"
              }
              className="min-h-[44px] max-h-60 w-full resize-none overflow-y-auto bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                title="Attach files"
                aria-label="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                onClick={() => setImgMode((v) => !v)}
                className={`flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-colors ${
                  imgMode
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                title="Toggle image generation"
              >
                <ImageIcon className="h-4 w-4" />
                {imgMode ? "Image" : "Chat"}
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setSpeakReplies((v) => !v)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  speakReplies ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                }`}
                title={speakReplies ? "Voice replies on" : "Voice replies off"}
                aria-label="Toggle voice replies"
              >
                {speakReplies ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                onClick={toggleMic}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  listening ? "bg-red-500 text-white animate-pulse" : "text-muted-foreground hover:bg-muted"
                }`}
                title={listening ? "Stop voice input" : "Start voice input"}
                aria-label="Voice input"
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setLiveOpen(true)}
                className="flex h-8 items-center gap-1 rounded-lg bg-green-600 px-2.5 text-xs font-medium text-white hover:bg-green-700"
                title="Live voice chat"
                aria-label="Live voice chat"
              >
                <Radio className="h-3.5 w-3.5" /> Live
              </button>
              <button
                onClick={() => send()}
                disabled={busy || (!input.trim() && attachments.length === 0)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-opacity disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Genelo can make mistakes. Verify important information.
          </p>
        </div>
      </div>

      {liveOpen && (
        <LiveTalk
          mode={mode}
          onClose={() => setLiveOpen(false)}
        />
      )}
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
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {msg.attachments.map((a, i) =>
                a.kind === "image" ? (
                  <img key={i} src={a.dataUrl} alt={a.name} className="h-20 w-20 rounded-md object-cover" />
                ) : (
                  <div key={i} className="flex items-center gap-1 rounded-md bg-background/10 px-2 py-1 text-xs">
                    <FileText className="h-3 w-3" /> {a.name}
                  </div>
                ),
              )}
            </div>
          )}
          <p className="whitespace-pre-wrap pr-6 text-sm">{msg.content}</p>
          <button
            onClick={copy}
            className="absolute -left-9 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
            aria-label="Copy your message"
            title="Copy"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
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
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            <span className={copied ? "text-green-500" : ""}>{copied ? "Copied" : "Copy response"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Welcome({ name, onPick }: { name: string; onPick: (text: string) => void }) {
  const examples = [
    "Build a responsive React pricing card with Tailwind",
    "Explain useEffect cleanup with an example",
    "Calculate compound interest for 500,000 at 8% over 5 years",
    "Generate an image of a futuristic Dar es Salaam skyline at sunset",
  ];
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  return (
    <div className="mx-auto max-w-2xl pt-12 text-center">
      <img
        src={LOGO_URL}
        alt="Genelo AI"
        width={72}
        height={56}
        className="mx-auto h-14 w-[4.5rem] rounded-2xl border-2 border-foreground/80 bg-background object-contain p-1 shadow-sm"
        loading="eager"
      />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Welcome back, {capitalized} 👋
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        How can Genelo help you today?
      </p>
      <div className="mt-8 grid gap-2 text-left sm:grid-cols-2">
        {examples.map((e) => (
          <button
            key={e}
            onClick={() => onPick(e)}
            className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-accent hover:text-foreground"
          >
            {e}
          </button>
        ))}
      </div>
      {!isNativeApp() && (
        <a
          href={APK_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Download Genelo AI Android APK
        </a>
      )}
    </div>
  );
}

function LiveTalk({ mode, onClose }: { mode: ModeId; onClose: () => void }) {
  const chatFn = useServerFn(chatWithGenelo);
  const [state, setState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [levels, setLevels] = useState<number[]>(() => Array(28).fill(0.15));
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const recRef = useRef<any>(null);
  const stoppedRef = useRef(false);
  const speakingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const pendingRef = useRef<string>("");
  const bargedRef = useRef(false);

  // Mic waveform + barge-in detection
  useEffect(() => {
    let raf = 0;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AC();
        ctxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        src.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const bars = 28;
          const step = Math.floor(data.length / bars);
          const out: number[] = [];
          let sum = 0;
          for (let i = 0; i < bars; i++) {
            let v = 0;
            for (let j = 0; j < step; j++) v += data[i * step + j];
            v = v / step / 255;
            out.push(v);
            sum += v;
          }
          setLevels(out);
          const avg = sum / bars;
          if (speakingRef.current && avg > 0.18 && !bargedRef.current) {
            bargedRef.current = true;
            window.speechSynthesis.cancel();
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        toast.error("Microphone permission needed for live chat.");
      }
    })();
    return () => {
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  function speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
      const plain = text.replace(/```[\s\S]*?```/g, " code block ").replace(/[#*_`>-]/g, "");
      const u = new SpeechSynthesisUtterance(plain.slice(0, 1500));
      u.rate = 1.05;
      u.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      const pref = voices.find((v) => /en-US|en-GB/i.test(v.lang) && /female|samantha|zira|google/i.test(v.name))
        || voices.find((v) => /en/i.test(v.lang));
      if (pref) u.voice = pref;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    });
  }

  async function askAndSpeak(userText: string) {
    historyRef.current.push({ role: "user", content: userText });
    setState("thinking");
    setReply("");
    try {
      const r = await chatFn({
        data: {
          modeId: mode,
          messages: historyRef.current.map((m) => ({ role: m.role, content: m.content })) as any,
        },
      });
      if (!r.ok) throw new Error(r.error);
      const text = r.content;
      historyRef.current.push({ role: "assistant", content: text });
      setReply(text);
      setState("speaking");
      speakingRef.current = true;
      bargedRef.current = false;
      await speak(text);
    } catch (e: any) {
      toast.error(e?.message || "AI error");
    } finally {
      speakingRef.current = false;
      setState("listening");
    }
  }

  useEffect(() => {
    stoppedRef.current = false;
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice not supported in this browser. Try Chrome.");
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = navigator.language || "en-US";
    recRef.current = r;

    let silenceTimer: any = null;
    const scheduleSubmit = () => {
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        const t = pendingRef.current.trim();
        if (t) {
          pendingRef.current = "";
          setTranscript("");
          askAndSpeak(t);
        }
      }, 1100);
    };

    r.onresult = (ev: any) => {
      let interim = "";
      let finalAdd = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) finalAdd += res[0].transcript + " ";
        else interim += res[0].transcript;
      }
      if ((interim || finalAdd) && speakingRef.current) {
        window.speechSynthesis.cancel();
      }
      if (finalAdd) pendingRef.current += finalAdd;
      setTranscript(pendingRef.current + interim);
      if (finalAdd) scheduleSubmit();
    };
    r.onerror = () => {};
    r.onend = () => {
      if (!stoppedRef.current) {
        try { r.start(); } catch { /* ignore */ }
      }
    };
    setState("listening");
    try { r.start(); } catch { /* ignore */ }

    return () => {
      stoppedRef.current = true;
      clearTimeout(silenceTimer);
      try { r.stop(); } catch { /* ignore */ }
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function end() {
    stoppedRef.current = true;
    try { recRef.current?.stop(); } catch { /* ignore */ }
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    onClose();
  }

  const label =
    state === "listening" ? "Listening…" :
    state === "thinking" ? "Thinking…" :
    state === "speaking" ? "Speaking…" : "Connecting…";

  const ringColor =
    state === "listening" ? "from-sky-400 to-blue-600" :
    state === "speaking" ? "from-emerald-400 to-green-600" :
    state === "thinking" ? "from-amber-400 to-orange-600" :
    "from-muted to-muted";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-xl">
      <button
        onClick={end}
        className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted"
        aria-label="End live chat"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative flex h-56 w-56 items-center justify-center">
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${ringColor} opacity-20 blur-2xl animate-pulse`} />
        <div className={`absolute inset-4 rounded-full bg-gradient-to-br ${ringColor} opacity-30 blur-xl`} />
        <div className={`relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br ${ringColor} shadow-2xl`}>
          <div className="flex items-end gap-[3px] h-16">
            {levels.map((v, i) => {
              const speakingWave = 0.35 + Math.abs(Math.sin(Date.now() / 140 + i * 0.6)) * 0.55;
              const raw = state === "speaking" ? speakingWave : v * 1.8;
              const h = Math.max(6, Math.min(64, raw * 64));
              return (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-white/90 transition-[height] duration-75"
                  style={{ height: `${h}px` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 text-lg font-semibold">{label}</div>
      <div className="mt-3 max-w-md px-6 text-center text-sm text-muted-foreground min-h-12">
        {state === "speaking"
          ? reply.slice(0, 260)
          : transcript || "Just start talking — I'm listening. You can interrupt me anytime."}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={() => { if (speakingRef.current) window.speechSynthesis.cancel(); }}
          className="rounded-full border border-border bg-background px-4 py-2 text-xs font-medium hover:bg-muted"
        >
          Interrupt
        </button>
        <button
          onClick={end}
          className="rounded-full bg-red-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
        >
          End call
        </button>
      </div>
    </div>
  );
}
