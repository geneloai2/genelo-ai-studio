import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Loader2 } from "lucide-react";
import logoAsset from "@/assets/genelo-ai-logo.png.asset.json";
import { toast, Toaster } from "sonner";

const SITE_ORIGIN = "https://geneloai.lovable.app";
const LOGO_IMAGE = `${SITE_ORIGIN}${logoAsset.url}`;

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Genelo AI" },
      { name: "description", content: "Sign in to Genelo AI to start coding, researching and creating." },
      { property: "og:title", content: "Sign in — Genelo AI" },
      { property: "og:description", content: "Sign in to Genelo AI to start coding, researching and creating." },
      { property: "og:url", content: `${SITE_ORIGIN}/login` },
      { property: "og:image", content: LOGO_IMAGE },
      { name: "twitter:image", content: LOGO_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/login` }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
        if (e2) throw e2;
        toast.success("Welcome to Genelo AI!");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    try {
      const r = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (r.error) {
        toast.error("Google sign-in failed");
        return;
      }
      if (r.redirected) return;
      navigate({ to: "/" });
    } catch (e) {
      toast.error("Google sign-in failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <img
            src={LOGO_IMAGE}
            alt="Genelo AI"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl border border-border bg-background object-contain p-0.5"
            loading="eager"
          />
          <span className="text-lg font-semibold tracking-tight">Genelo AI</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to continue to Genelo."
              : "Free forever. Upgrade for Pro modes."}
          </p>

          <button
            onClick={google}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="my-4 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-foreground/40"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-foreground/40"
            />
            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-sm font-medium text-background disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.3 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.3 29.6 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14-5.5l-6.5-5.3C29.6 34.6 26.9 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.5 5.3C40.9 35.6 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
