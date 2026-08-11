import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Attachment = z.object({
  name: z.string().max(200),
  mime: z.string().max(120),
  kind: z.enum(["image", "file"]),
  dataUrl: z.string().max(600_000).optional(),
  text: z.string().max(20000).optional(),
});

const Msg = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(40000),
  image: z.string().url().optional(),
  attachments: z.array(Attachment).max(4).optional(),
});

export const listChats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("chats")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    return { chats: data ?? [] };
  });

export const getChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: chat } = await context.supabase
      .from("chats")
      .select("id, title, messages, updated_at")
      .eq("id", data.id)
      .maybeSingle();
    return { chat };
  });

export const saveChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().min(1).max(120),
        messages: z.array(Msg).min(1).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase
        .from("chats")
        .update({
          title: data.title,
          messages: data.messages,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await context.supabase
        .from("chats")
        .insert({
          user_id: context.userId,
          title: data.title,
          messages: data.messages,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const deleteChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("chats").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
