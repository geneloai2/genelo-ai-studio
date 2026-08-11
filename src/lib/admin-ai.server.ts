/** Server-only admin data helpers exposed to Genelo AI when an admin is chatting. */

export async function adminStats() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

  const [users, pro, todayUsage, weekUsage] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "pro"),
    supabaseAdmin.from("image_usage").select("count").eq("day", today),
    supabaseAdmin.from("image_usage").select("day, count").gte("day", since),
  ]);

  const imagesToday = (todayUsage.data ?? []).reduce(
    (a: number, r: { count: number | null }) => a + (r.count ?? 0),
    0,
  );
  const byDay: Record<string, number> = {};
  (weekUsage.data ?? []).forEach((r: { day: string; count: number | null }) => {
    byDay[r.day] = (byDay[r.day] ?? 0) + (r.count ?? 0);
  });
  const week: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    week.push({ day: d, count: byDay[d] ?? 0 });
  }

  const total = users.count ?? 0;
  const proCount = pro.count ?? 0;
  return {
    ok: true as const,
    totals: { users: total, pro: proCount, free: total - proCount, imagesToday },
    week,
  };
}

export async function adminListUsers(q?: string, limit?: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const max = Math.min(Math.max(limit ?? 50, 1), 200);

  let query = supabaseAdmin
    .from("profiles")
    .select("id, email, plan, created_at, display_name")
    .order("created_at", { ascending: false })
    .limit(max);
  if (q) query = query.ilike("email", `%${q}%`);
  const { data: profiles, error } = await query;
  if (error) return { ok: false as const, error: error.message };

  const ids = (profiles ?? []).map((p) => p.id);
  const { data: roles } = ids.length
    ? await supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids)
    : { data: [] as { user_id: string; role: string }[] };

  const roleMap: Record<string, string[]> = {};
  (roles ?? []).forEach((r) => {
    roleMap[r.user_id] = [...(roleMap[r.user_id] ?? []), r.role as string];
  });

  return {
    ok: true as const,
    count: profiles?.length ?? 0,
    users: (profiles ?? []).map((p) => ({
      email: p.email,
      name: p.display_name,
      plan: p.plan,
      roles: roleMap[p.id] ?? [],
      joined: p.created_at,
    })),
  };
}
