import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { listChats, deleteChat } from "@/lib/chats.functions";
import { getProfile, updateProfile } from "@/lib/genelo.functions";
import { MODES, type ModeId } from "@/lib/modes";
import {
  ArrowLeft,
  Sun,
  Moon,
  Trash2,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Loader2,
  Crown,
  User as UserIcon,
  Camera,
  Sparkles,
  Save,
  Lock,
} from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Genelo AI" },
      { name: "description", content: "Manage your Genelo AI profile, theme, AI model, chat history and more." },
    ],
  }),
  component: SettingsPage,
});

type Profile = { plan: string; email?: string | null; display_name?: string | null; avatar_url?: string | null };

function SettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [chats, setChats] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ModeId>(() => {
    if (typeof window === "undefined") return "gn35";
    return ((localStorage.getItem("genelo-mode") as ModeId) || "gn35") as ModeId;
  });

  const listFn = useServerFn(listChats);
  const delFn = useServerFn(deleteChat);
  const profileFn = useServerFn(getProfile);
  const updateProfileFn = useServerFn(updateProfile);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    listFn()
      .then((r) => {
        setChats(r?.chats ?? []);
        setLoadingChats(false);
      })
      .catch(() => setLoadingChats(false));
    profileFn()
      .then((r) => {
        const p = (r.profile as Profile) ?? null;
        setProfile(p);
        setDisplayName(p?.display_name ?? "");
      })
      .catch(() => setProfile(null));
  }, [user, listFn, profileFn]);

  function pickMode(m: ModeId, locked: boolean) {
    if (locked) {
      toast.error("This model is Pro-only. Upgrade to unlock.");
      return;
    }
    setMode(m);
    localStorage.setItem("genelo-mode", m);
    toast.success(`AI model set to ${MODES.find((x) => x.id === m)?.name}`);
  }

  async function saveName() {
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      const r = await updateProfileFn({ data: { display_name: displayName.trim() } });
      if (!r.ok) throw new Error(r.error);
      setProfile((p) => (p ? { ...p, display_name: displayName.trim() } : p));
      toast.success("Name saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save name");
    } finally {
      setSavingName(false);
    }
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image too large (max 4MB)");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      const r = await updateProfileFn({ data: { avatar_url: url } });
      if (!r.ok) throw new Error(r.error);
      setProfile((p) => (p ? { ...p, avatar_url: url } : p));
      toast.success("Profile picture updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this chat?")) return;
    await delFn({ data: { id } });
    setChats((c) => c.filter((x) => x.id !== id));
    toast.success("Chat deleted");
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isPro = profile?.plan === "pro";
  const initial = (profile?.display_name || profile?.email || user.email || "G").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-sm font-semibold">Settings</h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/login" });
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {/* Profile */}
        <Section title="Profile" icon={<UserIcon className="h-4 w-4" />}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="h-20 w-20 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-foreground">
                  {initial}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background shadow-md hover:opacity-90 disabled:opacity-50"
                aria-label="Change photo"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAvatar(f);
                  if (fileRef.current) fileRef.current.value = "";
                }}
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="text-xs text-muted-foreground">{profile?.email ?? user.email}</div>
              <div className="flex gap-2">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                />
                <button
                  onClick={saveName}
                  disabled={savingName || !displayName.trim()}
                  className="inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background disabled:opacity-50"
                >
                  {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </button>
              </div>
              <div className="text-xs text-muted-foreground">
                Plan: <span className="font-medium text-foreground">{isPro ? "Genelo Pro" : "Free"}</span>
              </div>
            </div>
          </div>
          {!isPro && (
            <Link
              to="/pricing"
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
            >
              <Crown className="h-3.5 w-3.5" /> Upgrade · TSh 1,200/mo
            </Link>
          )}
        </Section>

        {/* AI Model */}
        <Section title="AI Model" icon={<Sparkles className="h-4 w-4" />}>
          <p className="mb-3 text-xs text-muted-foreground">
            Choose which Genelo model powers your conversations. Pro models need an upgrade.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {MODES.map((m) => {
              const active = mode === m.id;
              const locked = m.pro && !isPro;
              return (
                <button
                  key={m.id}
                  onClick={() => pickMode(m.id, locked)}
                  className={`rounded-xl border px-3 py-3 text-left transition-all ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card hover:border-foreground/30"
                  } ${locked ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{m.name}</span>
                    <span className={`ml-auto text-[10px] uppercase ${active ? "text-background/70" : "text-muted-foreground"}`}>
                      {m.tag}
                    </span>
                    {locked && <Lock className="h-3 w-3" />}
                  </div>
                  <div className={`mt-1 text-[11px] ${active ? "text-background/70" : "text-muted-foreground"}`}>
                    {m.description}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance" icon={theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Dark mode</div>
              <div className="text-xs text-muted-foreground">Switch between light and dark themes.</div>
            </div>
            <button
              onClick={toggle}
              className={`relative h-6 w-11 rounded-full transition-colors ${theme === "dark" ? "bg-foreground" : "bg-muted"}`}
              aria-label="Toggle theme"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </div>
        </Section>

        <Section title="Chat history" icon={<MessageSquare className="h-4 w-4" />}>
          {loadingChats ? (
            <div className="text-xs text-muted-foreground">Loading…</div>
          ) : chats.length === 0 ? (
            <div className="text-xs text-muted-foreground">No saved chats yet. Start a conversation on the home page.</div>
          ) : (
            <ul className="divide-y divide-border">
              {chats.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link
                    to="/"
                    search={{ chat: c.id } as any}
                    className="flex-1 truncate text-sm hover:underline"
                  >
                    {c.title}
                  </Link>
                  <span className="hidden text-[11px] text-muted-foreground sm:block">
                    {new Date(c.updated_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => remove(c.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="About Genelo AI">
          <p className="text-sm text-muted-foreground">
            Genelo AI is a professional assistant built in Tanzania for coding in any language, research,
            teaching, image generation, Q&A and calculations — fast, friendly and private.
          </p>
        </Section>

        <Section title="Founder story">
          <p className="text-sm text-muted-foreground">
            Genelo was founded by <span className="font-medium text-foreground">Genelo Moses</span>,
            a young Tanzanian builder from Vwawa, Songwe. Driven by the belief that powerful AI should be
            available to every African student, developer and entrepreneur, he started Genelo to put
            world-class tools into local hands — at a fair price, in a clean, simple interface.
          </p>
        </Section>

        <Section title="Contact us">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a className="hover:underline" href="mailto:genelomoses01@gmail.com">genelomoses01@gmail.com</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a className="hover:underline" href="mailto:genelopay@gmail.com">genelopay@gmail.com</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a className="hover:underline" href="mailto:geneloai2@gmail.com">geneloai2@gmail.com</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a className="hover:underline" href="tel:+255621673848">+255 621 673 848</a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Vwawa, Songwe, Mbeya — Tanzania
            </li>
          </ul>
        </Section>

        <Section title="Our other products">
          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href="https://geneloshop.lovable.app"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-accent"
            >
              <span>
                <span className="font-medium">Genelo Shop</span>
                <span className="block text-xs text-muted-foreground">geneloshop.lovable.app</span>
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href="https://genelopay.lovable.app"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-accent"
            >
              <span>
                <span className="font-medium">Genelo Pay</span>
                <span className="block text-xs text-muted-foreground">genelopay.lovable.app</span>
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </Section>

        <Section title="Terms & Services">
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              By using Genelo AI you agree to use it lawfully and responsibly. Outputs may contain mistakes —
              always verify important information. Do not use Genelo AI for illegal, harmful or deceptive activity.
            </p>
            <p>
              Pro plan (TSh 1,200/month) is billed monthly and grants access to Pro modes and unlimited image
              generation. You can cancel anytime; service continues until the end of the paid period.
            </p>
            <p>
              We store only the data needed to operate the service (account, plan, chats you create). We do not
              sell your data. For any privacy or account request, email <a className="underline" href="mailto:genelomoses01@gmail.com">genelomoses01@gmail.com</a>.
            </p>
            <p>© {new Date().getFullYear()} Genelo AI. All rights reserved.</p>
          </div>
        </Section>
      </main>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
