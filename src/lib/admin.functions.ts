import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden: admin only");
}

export const getAdminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const today = new Date().toISOString().slice(0, 10);
    const since = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

    const [users, pro, todayUsage, weekUsage, recent] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "pro"),
      supabaseAdmin.from("image_usage").select("count").eq("day", today),
      supabaseAdmin.from("image_usage").select("day, count").gte("day", since),
      supabaseAdmin
        .from("profiles")
        .select("id, email, plan, created_at, avatar_url, display_name")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const imagesToday = (todayUsage.data ?? []).reduce(
      (a: number, r: any) => a + (r.count ?? 0),
      0,
    );
    const byDay: Record<string, number> = {};
    (weekUsage.data ?? []).forEach((r: any) => {
      byDay[r.day] = (byDay[r.day] ?? 0) + (r.count ?? 0);
    });
    const days: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days.push({ day: d, count: byDay[d] ?? 0 });
    }

    return {
      totals: {
        users: users.count ?? 0,
        pro: pro.count ?? 0,
        free: (users.count ?? 0) - (pro.count ?? 0),
        imagesToday,
      },
      week: days,
      recent: recent.data ?? [],
    };
  });

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ q: z.string().max(120).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    let query = supabaseAdmin
      .from("profiles")
      .select("id, email, plan, created_at, avatar_url, display_name")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.q) query = query.ilike("email", `%${data.q}%`);
    const { data: profiles } = await query;

    const ids = (profiles ?? []).map((p) => p.id);
    const { data: roles } = ids.length
      ? await supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids)
      : { data: [] as any[] };

    const roleMap: Record<string, string[]> = {};
    (roles ?? []).forEach((r: any) => {
      roleMap[r.user_id] = [...(roleMap[r.user_id] ?? []), r.role];
    });

    return {
      users: (profiles ?? []).map((p) => ({ ...p, roles: roleMap[p.id] ?? [] })),
    };
  });

export const setUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ userId: z.string().uuid(), plan: z.enum(["free", "pro"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ plan: data.plan })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ userId: z.string().uuid(), grant: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: "admin" });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      if (data.userId === context.userId) throw new Error("You cannot remove your own admin role.");
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const grantAdminByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", data.email)
      .maybeSingle();
    if (!profile) throw new Error("No user found with that email. They must sign up first.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: profile.id, role: "admin" });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const checkAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });
