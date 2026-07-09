import { createClient } from "@supabase/supabase-js";
import { safeLocalStorage } from "./safe-storage";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Default auth storage is unguarded `window.localStorage` — in Safari Private Mode (or any
// storage-blocked browser) a throwing `setItem` means the session silently fails to persist and
// the user appears logged out on the next reload. `safeLocalStorage` degrades to an in-memory
// store instead, so the session survives for the tab even when it can't survive a reload.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: safeLocalStorage,
  },
});
