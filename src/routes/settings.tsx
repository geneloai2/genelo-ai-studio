import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { listChats, deleteChat } from "@/lib/chats.functions";
import { getProfile } from "@/lib/genelo.functions";
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
} from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Genelo AI" },
      { name: "description", content: "Manage your Genelo AI profile, theme, chat history and learn about us." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [chats, setChats] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const [profile, setProfile] = useState<{ plan: string; email: string } | null>(null);
  const [loadingChats, setLoadingChats] = useState(true);

  const listFn = useServerFn(listChats);
  const delFn = useServerFn(deleteChat);
  const profileFn = useServerFn(getProfile);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    listFn().then((r) => {
      setChats(r.chats);
      setLoadingChats(false);
    });
    profileFn().then((r) => setProfile(r.profile as any));
  }, [user, listFn, profileFn]);

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
        <Section title="Profile" icon={<UserIcon className="h-4 w-4" />}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{profile?.email ?? user.email}</div>
              <div className="text-xs text-muted-foreground">
                Plan: {profile?.plan === "pro" ? "Genelo Pro" : "Free"}
              </div>
            </div>
            {profile?.plan !== "pro" && (
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
              >
                <Crown className="h-3.5 w-3.5" /> Upgrade
              </Link>
            )}
          </div>
        </Section>

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
