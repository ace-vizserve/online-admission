import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    "https://dioketiuedohqlaegzhm.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpb2tldGl1ZWRvaHFsYWVnemhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NDI4NTksImV4cCI6MjA1MzExODg1OX0.aOl2aPqWDCvzc1eCenT2cqkSPw87zDc36WB9x1dyxs4"
  );
}
