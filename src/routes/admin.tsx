import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import {
  getAdminOverview,
  listUsers,
  setUserPlan,
  setAdminRole,
  grantAdminByEmail,
  checkAdmin,
} from "@/lib/admin.functions";
import logoAsset from "@/assets/genelo-ai-logo.png.asset.json";
import {
  Users,
  Crown,
  ImageIcon,
  TrendingUp,
  Loader2,
  Search,
  Shield,
  ShieldOff,
  ArrowLeft,
  Plus,
  LayoutGrid,
  Lightbulb,
  BarChart3,
  FileSearch,
  Files,
  Map as MapIcon,
  EyeOff,
  Gauge,
  Link2,
  Trophy,
  Settings as SettingsIcon,
  Menu,
  HelpCircle,
  Bell,
} from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Genelo AI Console — Admin dashboard" },
      { name: "description", content: "Genelo AI Console: users, plans, roles and platform performance." },
    ],
  }),
  component: AdminPage,
});

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;
type UserRow = Awaited<ReturnType<typeof listUsers>>["users"][number];

const NAV: { section?: string; items: { label: string; icon: React.ReactNode }[] }[] = [
  {
    items: [
      { label: "Overview", icon: <LayoutGrid className="h-4 w-4" /> },
      { label: "Insights", icon: <Lightbulb className="h-4 w-4" /> },
      { label: "Performance", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "User inspection", icon: <FileSearch className="h-4 w-4" /> },
    ],
  },
  {
    section: "Accounts",
    items: [
      { label: "Users", icon: <Files className="h-4 w-4" /> },
      { label: "Plans", icon: <MapIcon className="h-4 w-4" /> },
      { label: "Suspensions", icon: <EyeOff className="h-4 w-4" /> },
    ],
  },
  {
    section: "Experience",
    items: [{ label: "Core AI vitals", icon: <Gauge className="h-4 w-4" /> }],
  },
  {
    items: [
      { label: "Links", icon: <Link2 className="h-4 w-4" /> },
      { label: "Achievements", icon: <Trophy className="h-4 w-4" /> },
      { label: "Settings", icon: <SettingsIcon className="h-4 w-4" /> },
    ],
  },
];

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<null | boolean>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [newAdmin, setNewAdmin] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [active, setActive] = useState("Performance");
  const [range, setRange] = useState("7 days");

  const overviewFn = useServerFn(getAdminOverview);
  const listFn = useServerFn(listUsers);
  const planFn = useServerFn(setUserPlan);
  const roleFn = useServerFn(setAdminRole);
  const grantFn = useServerFn(grantAdminByEmail);
  const checkFn = useServerFn(checkAdmin);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    checkFn().then((r) => setAllowed(r.isAdmin));
  }, [user, checkFn]);

  useEffect(() => {
    if (!allowed) return;
    refresh();
  }, [allowed]);

  async function refresh() {
    setBusy(true);
    try {
      const [o, u] = await Promise.all([overviewFn(), listFn({ data: { q } })]);
      setOverview(o);
      setUsers(u.users);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load");
    } finally {
      setBusy(false);
    }
  }

  async function search() {
    try {
      const u = await listFn({ data: { q } });
      setUsers(u.users);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function changePlan(u: UserRow, plan: "free" | "pro") {
    try {
      await planFn({ data: { userId: u.id, plan } });
      toast.success(`Plan updated for ${u.email}`);
      setUsers((xs) => xs.map((x) => (x.id === u.id ? { ...x, plan } : x)));
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function toggleAdmin(u: UserRow) {
    const isAdmin = u.roles.includes("admin");
    try {
      await roleFn({ data: { userId: u.id, grant: !isAdmin } });
      toast.success(isAdmin ? "Admin removed" : "Admin granted");
      setUsers((xs) =>
        xs.map((x) =>
          x.id === u.id
            ? {
                ...x,
                roles: isAdmin ? x.roles.filter((r) => r !== "admin") : [...x.roles, "admin"],
              }
            : x,
        ),
      );
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!newAdmin.trim()) return;
    try {
      await grantFn({ data: { email: newAdmin.trim() } });
      toast.success(`Admin granted to ${newAdmin}`);
      setNewAdmin("");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (loading || !user || allowed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <Shield className="h-8 w-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Admins only</h1>
        <p className="text-sm text-muted-foreground">You don't have access to this page.</p>
        <Link to="/" className="text-sm font-medium underline">Back to chat</Link>
      </div>
    );
  }

  const week = overview?.week ?? [];
  const maxBar = Math.max(1, ...week.map((d) => d.count));
  const totals = overview?.totals;
  const proRate = totals && totals.users > 0 ? (totals.pro / totals.users) * 100 : 0;

  // Simple sparkline path for the performance chart
  const pts = week.map((d, i) => {
    const x = week.length > 1 ? (i / (week.length - 1)) * 100 : 0;
    const y = 100 - (d.count / maxBar) * 90;
    return `${x},${y}`;
  });

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />

      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background px-3 py-2.5">
        <button
          onClick={() => setNavOpen((v) => !v)}
          className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <img src={logoAsset.url} alt="Genelo AI" className="h-7 w-8 object-contain" />
          <span className="hidden text-lg tracking-tight text-foreground sm:inline">
            Genelo AI <span className="text-muted-foreground">Console</span>
          </span>
        </Link>
        <div className="relative mx-auto w-full max-w-2xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder='Inspect any user email in "geneloai.lovable.app"'
            className="w-full rounded-full bg-muted py-2.5 pl-11 pr-4 text-sm outline-none focus:bg-background focus:ring-1 focus:ring-border"
          />
        </div>
        <div className="hidden items-center gap-1 text-muted-foreground sm:flex">
          <button className="rounded-full p-2 hover:bg-muted" aria-label="Help"><HelpCircle className="h-5 w-5" /></button>
          <button className="rounded-full p-2 hover:bg-muted" aria-label="Notifications"><Bell className="h-5 w-5" /></button>
          <Link to="/" className="rounded-full p-2 hover:bg-muted" aria-label="Back to chat">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Left nav */}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-[280px] overflow-y-auto border-r border-border bg-background pt-16 transition-transform md:sticky md:top-[57px] md:h-[calc(100vh-57px)] md:translate-x-0 md:pt-0 ${
            navOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-3">
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-3">
              <img src={logoAsset.url} alt="" className="h-6 w-7 object-contain" />
              <span className="truncate text-sm">https://geneloai.lovable.app/</span>
            </div>
          </div>
          <nav className="pb-8">
            {NAV.map((group, gi) => (
              <div key={gi} className="border-t border-border py-2 first:border-t-0">
                {group.section && (
                  <div className="px-6 py-2 text-sm text-muted-foreground">{group.section}</div>
                )}
                {group.items.map((it) => (
                  <button
                    key={it.label}
                    onClick={() => {
                      setActive(it.label);
                      setNavOpen(false);
                    }}
                    className={`flex w-full items-center gap-4 rounded-r-full py-2.5 pl-6 pr-4 text-sm transition-colors ${
                      active === it.label
                        ? "bg-genelo-soft font-medium text-genelo"
                        : "text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    {it.icon}
                    {it.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        {navOpen && (
          <div className="fixed inset-0 z-10 bg-black/30 md:hidden" onClick={() => setNavOpen(false)} aria-hidden />
        )}

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-normal tracking-tight">{active}</h1>
            <button
              onClick={refresh}
              className="text-sm font-medium text-genelo hover:underline"
            >
              Refresh data
            </button>
          </div>

          {/* Filter row */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {["24 hours", "7 days", "28 days", "3 months"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-full border px-4 py-1.5 text-sm ${
                  range === r
                    ? "border-genelo bg-genelo-soft font-medium text-genelo"
                    : "border-border text-foreground/80 hover:bg-muted"
                }`}
              >
                {r}
              </button>
            ))}
            <div className="ml-auto text-xs text-muted-foreground">
              Last update: just now
            </div>
          </div>

          <div className="mb-4 flex items-start gap-3 rounded-lg bg-genelo-soft px-4 py-3 text-sm text-foreground/80">
            <Lightbulb className="mt-0.5 h-4 w-4 text-genelo" />
            <p>
              Genelo AI usage data is shown in your local timezone. Ask Genelo AI in chat for a full written
              report of these numbers.
            </p>
          </div>

          {/* Metric tiles — Search Console style */}
          <section className="grid grid-cols-2 overflow-hidden rounded-xl border border-border lg:grid-cols-4">
            <Tile
              label="Total users"
              value={totals?.users ?? 0}
              icon={<Users className="h-4 w-4" />}
              tone="blue"
            />
            <Tile
              label="Pro users"
              value={totals?.pro ?? 0}
              icon={<Crown className="h-4 w-4" />}
              tone="purple"
            />
            <Tile
              label="Pro conversion"
              value={`${proRate.toFixed(1)}%`}
              icon={<TrendingUp className="h-4 w-4" />}
              tone="plain"
            />
            <Tile
              label="Images today"
              value={totals?.imagesToday ?? 0}
              icon={<ImageIcon className="h-4 w-4" />}
              tone="orange"
            />
          </section>

          {/* Chart */}
          <section className="mt-4 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm text-muted-foreground">Image generations · last 7 days</h2>
              <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                Daily
              </span>
            </div>
            <div className="relative mt-4 h-48 w-full">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                {[0, 25, 50, 75, 100].map((y) => (
                  <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--border)" strokeWidth="0.3" />
                ))}
                {pts.length > 1 && (
                  <polyline
                    points={pts.join(" ")}
                    fill="none"
                    stroke="var(--genelo)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              {week.map((d) => (
                <span key={d.day}>{d.day.slice(5)}</span>
              ))}
            </div>
          </section>

          {/* Grant admin */}
          <section className="mt-4 rounded-xl border border-border p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Plus className="h-4 w-4" /> Grant admin by email
            </h2>
            <form onSubmit={addAdmin} className="mt-3 flex flex-wrap gap-2">
              <input
                type="email"
                value={newAdmin}
                onChange={(e) => setNewAdmin(e.target.value)}
                placeholder="user@example.com"
                className="min-w-[220px] flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-genelo"
              />
              <button className="rounded-full bg-genelo px-5 py-2 text-sm font-medium text-background">
                Grant admin
              </button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">The user must have signed up first.</p>
          </section>

          {/* Users table */}
          <section className="mt-4 rounded-xl border border-border">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="text-sm font-medium">Users</h2>
              <button
                onClick={search}
                className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted"
              >
                Apply search
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Account</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Roles</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {busy && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                      </td>
                    </tr>
                  )}
                  {!busy && users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                        No users found.
                      </td>
                    </tr>
                  )}
                  {users.map((u) => {
                    const isAdmin = u.roles.includes("admin");
                    return (
                      <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-medium">
                          <div className="flex items-center gap-2.5">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt={u.email ?? ""}
                                referrerPolicy="no-referrer"
                                className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold uppercase text-muted-foreground">
                                {(u.display_name?.[0] ?? u.email?.[0] ?? "?")}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm leading-tight">{u.email ?? "—"}</span>
                              {u.display_name && (
                                <span className="text-[11px] leading-tight text-muted-foreground">
                                  {u.display_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              u.plan === "pro"
                                ? "bg-genelo-soft text-genelo"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {u.plan}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {u.roles.join(", ") || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => changePlan(u, u.plan === "pro" ? "free" : "pro")}
                              className="rounded-full border border-border px-3 py-1 text-[11px] hover:bg-muted"
                            >
                              {u.plan === "pro" ? "Set Free" : "Set Pro"}
                            </button>
                            <button
                              onClick={() => toggleAdmin(u)}
                              className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] ${
                                isAdmin
                                  ? "border border-border hover:bg-muted"
                                  : "bg-genelo text-background"
                              }`}
                            >
                              {isAdmin ? (
                                <>
                                  <ShieldOff className="h-3 w-3" /> Revoke
                                </>
                              ) : (
                                <>
                                  <Shield className="h-3 w-3" /> Make admin
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone: "blue" | "purple" | "orange" | "plain";
}) {
  const tones: Record<string, string> = {
    blue: "bg-genelo text-background",
    purple: "bg-foreground text-background",
    orange: "bg-destructive text-destructive-foreground",
    plain: "bg-background text-foreground",
  };
  return (
    <div className={`border-r border-border p-4 last:border-r-0 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-xs opacity-90">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-3xl font-normal tracking-tight">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}
