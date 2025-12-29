import { supabase } from "@/lib/client";
import { listAllUsers } from "@/lib/utils";
import { LoginSchema, RegistrationSchema } from "@/zod-schema";
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
    toast.error(err.message + "!", {
      description: "Please check your email and password, then try again.",
    });
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
    if (err.message === "Auth session missing!") {
      localStorage.clear();
      sessionStorage.clear();
      location.reload();
      return;
    }
    toast.error(err.message + "!");
  }
}

export async function userRegister({ firstName, lastName, relationship, email, password }: RegistrationSchema) {
  try {
    const users = await listAllUsers();

    const emailExist = users.find((user) => user.email === email);

    if (emailExist) {
      throw new Error("An account with this email already exists");
    }

    const { error } = await supabase.auth.signUp({
      options: {
        data: {
          fullName: `${lastName}, ${firstName}`,
          relationship,
          password_changed: true,
          temporary_password: null,
        },
      },
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    toast.success("Email verification has been sent!", {
      description: "Please check your email to confirm your account",
    });
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message + "!");
  }
}

export async function sendPasswordResetLink({ email }: { email: string }) {
  try {
    const users = await listAllUsers();

    const emailExist = users.find((user) => user.email?.toLowerCase() === email.toLowerCase());

    if (!emailExist) {
      throw new Error("An account with this email doesn't exists");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw new Error(error.message);
    }

    toast.success("Check your email!", {
      description: "If an account exists for this email, a password reset link has been sent.",
    });
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message + "!");
  }
}

export async function authUpdatePassword({ password }: { password: string }) {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
      data: {
        password_changed: true,
        temporary_password: null,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    await supabase.auth.signOut();

    toast.success("Password has been reset", {
      description: "You can now log in with your new password.",
    });
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message + "!");
    throw err;
  }
}

export async function updatePassword({ password }: { password: string }) {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
      data: {
        password_changed: true,
        temporary_password: null,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    toast.success("Password updated!", {
      description: "Your password has been changed successfully.",
    });
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message + "!");
  }
}
