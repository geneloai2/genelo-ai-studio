import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/zenopay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Verify ZenoPay api key header
        const headerKey =
          request.headers.get("x-api-key") ||
          request.headers.get("X-API-KEY") ||
          "";
        if (!headerKey || headerKey !== process.env.ZENOPAY_API_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: any;
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const status: string =
          payload?.payment_status || payload?.status || "";
        const orderId: string = payload?.order_id || payload?.reference || "";
        const userId: string | undefined =
          payload?.metadata?.user_id ||
          (typeof orderId === "string" && orderId.startsWith("genelo-pro-")
            ? undefined
            : undefined);

        if (status.toUpperCase() !== "COMPLETED") {
          // Not paid yet — acknowledge so ZenoPay doesn't retry forever
          return new Response("ok");
        }

        // Resolve user — prefer metadata; fall back to parsing order_id prefix
        let resolvedUserId = userId;
        if (!resolvedUserId && orderId.startsWith("genelo-pro-")) {
          const shortId = orderId.split("-")[2];
          if (shortId) {
            const { data } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .ilike("id", `${shortId}%`)
              .limit(1)
              .maybeSingle();
            if (data?.id) resolvedUserId = data.id;
          }
        }

        if (!resolvedUserId) {
          console.error("ZenoPay webhook: cannot resolve user", orderId);
          return new Response("ok");
        }

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ plan: "pro" })
          .eq("id", resolvedUserId);

        if (error) {
          console.error("ZenoPay webhook: upgrade failed", error);
          return new Response("error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
