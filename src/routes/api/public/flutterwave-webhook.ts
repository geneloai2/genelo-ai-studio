// Flutterwave webhook — receives payment events and upgrades the user to Pro
// when a charge for the genelo-pro-* reference completes successfully.
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/flutterwave-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Flutterwave sends a "verif-hash" header that matches the secret hash
        // you configured in the dashboard. We use the encryption key as the
        // shared secret.
        const expected = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
        const signature = request.headers.get("verif-hash");
        if (!expected || !signature || signature !== expected) {
          return new Response("Invalid signature", { status: 401 });
        }

        let body: any;
        try {
          body = await request.json();
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        const data = body?.data ?? body;
        const status: string | undefined = data?.status;
        const meta = data?.meta ?? data?.metadata ?? {};
        const userId: string | undefined = meta?.user_id;

        if (status === "successful" && userId) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({ plan: "pro" })
            .eq("id", userId);
          if (error) {
            console.error("Pro upgrade failed", error);
            return new Response("DB error", { status: 500 });
          }
        }
        return new Response("ok");
      },
    },
  },
});
