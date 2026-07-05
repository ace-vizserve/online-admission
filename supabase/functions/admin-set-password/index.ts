import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ADMIN_EMAILS = ["amier.vizbytes@vizserve.hfse.edu.sg", "ace.guevarra@vizserve.hfse.edu.sg"];

const allowedOrigins = ["https://enrol.hfse.edu.sg", "http://localhost:5173"];

function json(corsHeaders: Record<string, string>, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "https://enrol.hfse.edu.sg",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(corsHeaders, { error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) return json(corsHeaders, { error: "Unauthorized" }, 401);
    if (!ADMIN_EMAILS.includes(caller.email ?? "")) return json(corsHeaders, { error: "Forbidden" }, 403);

    const body = await req.json();
    const { action, email, password } = body;

    // ── list-accounts ───────────────────────────────────────────────────────────
    if (action === "list-accounts") {
      const {
        data: { users },
        error: listError,
      } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000000,
      });
      if (listError) return json(corsHeaders, { error: listError.message }, 500);

      const accounts = users
        .map((u) => ({
          id: u.id,
          email: u.email ?? "",
          fullName: (u.user_metadata?.fullName as string | undefined) ?? "",
          relationship: (u.user_metadata?.relationship as string | undefined) ?? "",
          emailConfirmed: !!u.email_confirmed_at,
          lastSignInAt: u.last_sign_in_at ?? null,
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      return json(corsHeaders, { accounts });
    }

    // ── set-password ────────────────────────────────────────────────────────────
    if (action === "set-password") {
      if (!email || typeof email !== "string") {
        return json(corsHeaders, { error: "Email is required" }, 400);
      }
      if (!password || typeof password !== "string" || password.length < 8) {
        return json(corsHeaders, { error: "Password must be at least 8 characters" }, 400);
      }

      const {
        data: { users },
        error: listError,
      } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000000,
      });
      if (listError) return json(corsHeaders, { error: listError.message }, 500);

      const targetUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!targetUser) return json(corsHeaders, { error: "No account found with that email" }, 404);

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
        password,
        user_metadata: {
          ...targetUser.user_metadata,
          password_changed: false,
          temporary_password: password,
        },
      });
      if (updateError) return json(corsHeaders, { error: updateError.message }, 500);

      return json(corsHeaders, { ok: true });
    }

    return json(corsHeaders, { error: "Unknown action" }, 400);
  } catch (error) {
    return json(corsHeaders, { error: (error as Error).message }, 500);
  }
});
