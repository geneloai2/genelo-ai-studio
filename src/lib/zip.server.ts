/**
 * Server-only helpers that package AI-generated project files into a real
 * .zip archive the user can download, with a daily quota per plan.
 */
import { zipSync, strToU8 } from "fflate";

export const ZIP_LIMIT_FREE = 3;
export const ZIP_LIMIT_PRO = 6;

export type ZipFile = { path: string; content: string };

function safePath(p: string) {
  return p
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .filter((s) => s && s !== "." && s !== "..")
    .join("/")
    .slice(0, 180);
}

function toBase64(bytes: Uint8Array) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export function buildZip(name: string, files: ZipFile[]) {
  const entries: Record<string, Uint8Array> = {};
  let total = 0;
  for (const f of files.slice(0, 40)) {
    const p = safePath(f.path || "file.txt");
    if (!p) continue;
    const content = String(f.content ?? "").slice(0, 200_000);
    total += content.length;
    if (total > 1_500_000) break;
    entries[p] = strToU8(content);
  }
  if (!Object.keys(entries).length) return { ok: false as const, error: "No files to zip." };

  const zipped = zipSync(entries, { level: 6 });
  const fileName = `${(name || "genelo-project").replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 60)}.zip`;
  return {
    ok: true as const,
    fileName,
    files: Object.keys(entries),
    bytes: zipped.length,
    dataUrl: `data:application/zip;base64,${toBase64(zipped)}`,
  };
}

/** Count + enforce the daily zip quota (free 3/day, pro 6/day). */
export async function checkZipQuota(userId: string, isPro: boolean) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = new Date().toISOString().slice(0, 10);
  const limit = isPro ? ZIP_LIMIT_PRO : ZIP_LIMIT_FREE;
  const { data: row } = await supabaseAdmin
    .from("image_usage")
    .select("id, count")
    .eq("user_id", userId)
    .eq("mode", "zip")
    .eq("day", today)
    .maybeSingle();
  const used = row?.count ?? 0;
  if (used >= limit) return { allowed: false as const, used, limit };
  return {
    allowed: true as const,
    used,
    limit,
    async commit() {
      if (row) {
        await supabaseAdmin.from("image_usage").update({ count: row.count + 1 }).eq("id", row.id);
      } else {
        await supabaseAdmin
          .from("image_usage")
          .insert({ user_id: userId, mode: "zip", day: today, count: 1 });
      }
    },
  };
}
