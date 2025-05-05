import { supabase } from "@/lib/client";
import { LoginSchema } from "@/zod-schema";
import { AuthError } from "@supabase/supabase-js";
import { toast } from "sonner";

export async function userLogin({ email, password }: LoginSchema) {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function userLogout() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}
