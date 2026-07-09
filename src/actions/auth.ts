import { supabase } from "@/lib/client";
import { safeLocalStorage, safeSessionStorage } from "@/lib/safe-storage";
import { checkEmailExists } from "@/lib/utils";
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
      safeLocalStorage.clear();
      safeSessionStorage.clear();
      location.reload();
      return;
    }
    toast.error(err.message + "!");
  }
}

export async function userRegister({
  firstName,
  lastName,
  relationship,
  email,
  password,
  isOpenHouseRegistration,
}: RegistrationSchema & { isOpenHouseRegistration?: boolean }) {
  try {
    const { exists, emailConfirmed } = await checkEmailExists(email);

    if (exists && emailConfirmed) {
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

    if (!isOpenHouseRegistration) {
      toast.success("Email verification has been sent!", {
        description: "Please check your email to confirm your account",
      });
    }
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message + "!");
  }
}

export async function sendPasswordResetLink({ email }: { email: string }) {
  try {
    const { exists, emailConfirmed } = await checkEmailExists(email);

    if (!exists) {
      throw new Error("An account with this email doesn't exists");
    }

    if (!emailConfirmed) {
      throw new Error("Your email is not yet verified. Please verify your email first.");
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

export async function updateAccountName({
  lastName,
  firstName,
  middleName,
}: {
  lastName: string;
  firstName: string;
  middleName?: string;
}) {
  try {
    const fullName = middleName ? `${lastName}, ${firstName}, ${middleName}` : `${lastName}, ${firstName}`;

    const { error } = await supabase.auth.updateUser({
      data: { fullName },
    });

    if (error) {
      throw new Error(error.message);
    }

    toast.success("Account name updated!", {
      description: "Your name has been changed successfully.",
    });
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message + "!");
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
