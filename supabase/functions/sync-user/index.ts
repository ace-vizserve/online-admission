// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, PostgrestError } from "npm:@supabase/supabase-js@2";
import { Database } from "../../../auth-database.types.ts";

interface PayloadProps {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: Database["auth"]["Tables"]["users"];
  record: Database["auth"]["Tables"]["users"]["Row"];
  old_record: Database["auth"]["Tables"]["users"]["Row"];
}

Deno.serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const payload: PayloadProps = await req.json();

    if (payload.record.email_confirmed_at == null) {
      return new Response("User not verified, skipping.", { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: existingUser } = await supabase
      .from("pp_registered_users")
      .select("id")
      .eq("id", payload.record.id)
      .single();

    if (existingUser) {
      return new Response("User already exists.", { status: 400 });
    }

    const { error } = await supabase.from("pp_registered_users").insert({
      id: payload.record.id,
      firstName: (payload.record.raw_user_meta_data as { firstName: string }).firstName,
      lastName: (payload.record.raw_user_meta_data as { lastName: string }).lastName,
      relationship: (payload.record.raw_user_meta_data as { relationship: string }).relationship,
      email: payload.record.email,
    });

    if (error) {
      console.error("Insert error:", error);
      throw error;
    }

    return new Response(JSON.stringify({ message: "New account has been created!" }), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  } catch (err) {
    const error = err as PostgrestError;
    console.error("Function error:", err);
    return new Response(String(error.message ?? err), { status: 500 });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/sync-user' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
