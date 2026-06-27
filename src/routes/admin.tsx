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
import {
  Sparkles,
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
} from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Genelo AI" },
      { name: "description", content: "Genelo AI admin dashboard." },
    ],
  }),
  component: AdminPage,
});

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;
type UserRow = Awaited<ReturnType<typeof listUsers>>["users"][number];

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<null | boolean>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [newAdmin, setNewAdmin] = useState("");

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

  const maxBar = Math.max(1, ...(overview?.week.map((d) => d.count) ?? [1]));

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-full p-2 text-muted-foreground hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Genelo Admin</div>
              <div className="text-[11px] text-muted-foreground">Dashboard & analytics</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">
            <Shield className="h-3.5 w-3.5" /> Admin
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* Stats */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<Users className="h-4 w-4" />} label="Total users" value={overview?.totals.users ?? 0} />
          <Stat icon={<Crown className="h-4 w-4" />} label="Pro users" value={overview?.totals.pro ?? 0} />
          <Stat icon={<TrendingUp className="h-4 w-4" />} label="Free users" value={overview?.totals.free ?? 0} />
          <Stat icon={<ImageIcon className="h-4 w-4" />} label="Images today" value={overview?.totals.imagesToday ?? 0} />
        </section>

        {/* Chart */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Image generations · last 7 days</h2>
          <div className="mt-5 flex h-40 items-end gap-3">
            {overview?.week.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-foreground transition-all"
                  style={{ height: `${(d.count / maxBar) * 100}%`, minHeight: 2 }}
                  title={`${d.count} images`}
                />
                <div className="text-[10px] text-muted-foreground">{d.day.slice(5)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Add admin */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Grant admin by email
          </h2>
          <form onSubmit={addAdmin} className="mt-3 flex gap-2">
            <input
              type="email"
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
              placeholder="user@example.com"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
            />
            <button className="rounded-xl bg-foreground px-4 text-sm font-medium text-background">
              Grant admin
            </button>
          </form>
          <p className="mt-2 text-[11px] text-muted-foreground">
            The user must have signed up first.
          </p>
        </section>

        {/* Users table */}
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border p-4">
            <h2 className="text-sm font-semibold">Users</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                  placeholder="Search email…"
                  className="w-56 rounded-lg border border-border bg-background py-1.5 pl-7 pr-2 text-xs outline-none"
                />
              </div>
              <button onClick={search} className="rounded-lg border border-border px-3 py-1.5 text-xs">
                Search
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Plan</th>
                  <th className="px-4 py-2">Roles</th>
                  <th className="px-4 py-2">Joined</th>
                  <th className="px-4 py-2 text-right">Actions</th>
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
                    <tr key={u.id} className="border-t border-border">
                      <td className="px-4 py-2 font-medium">
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
                              <span className="text-[11px] text-muted-foreground leading-tight">
                                {u.display_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            u.plan === "pro"
                              ? "bg-foreground text-background"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {u.roles.join(", ") || "—"}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => changePlan(u, u.plan === "pro" ? "free" : "pro")}
                            className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent"
                          >
                            {u.plan === "pro" ? "Set Free" : "Set Pro"}
                          </button>
                          <button
                            onClick={() => toggleAdmin(u)}
                            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] ${
                              isAdmin
                                ? "border border-border hover:bg-accent"
                                : "bg-foreground text-background"
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
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value.toLocaleString()}</div>
    </div>
  );
}
