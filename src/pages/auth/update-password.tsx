import { authUpdatePassword } from "@/actions/auth";
import Logo from "@/components/logo";
import PageMetaData from "@/components/page-metadata";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { UPDATE_PASSWORD_TITLE_DESCRIPTION } from "@/data";
import useSession from "@/hooks/use-session";
import { UpdatePasswordSchema, updatePasswordSchema } from "@/zod-schema";
import { usePasswordResetStore } from "@/zustand-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router";

function UpdatePassword() {
  const { title, description } = UPDATE_PASSWORD_TITLE_DESCRIPTION;
  const { passwordResetState } = useSession();
  const setPasswordResetState = usePasswordResetStore((state) => state.setPasswordResetState);

  const form = useForm<UpdatePasswordSchema>({
    defaultValues: { password: "" },
    resolver: zodResolver(updatePasswordSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: authUpdatePassword,
    onSuccess: () => setPasswordResetState(false),
    onError: () => form.setError("password", { message: "Failed to update password. Please try again." }),
  });

  function onSubmit(values: UpdatePasswordSchema) {
    mutate(values);
  }

  if (!passwordResetState) {
    return <Navigate to="/admission/dashboard" replace />;
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-lg space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <Logo className="h-20 w-auto" />

            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-primary">Secure Your Account</h1>
              <p className="font-medium text-slate-500 leading-relaxed">
                Almost there! Create a strong new password to regain access to your parent portal.
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput autoFocus placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                disabled={isPending}
                type="submit"
                className="w-full h-12 font-bold text-sm transition-all rounded-xl shadow-lg shadow-slate-200">
                {isPending ? (
                  <div className="flex items-center gap-3">
                    <span>Updating Security</span>
                    <DotPulse size="20" speed="1.3" color="white" />
                  </div>
                ) : (
                  "Update & Sign In"
                )}
              </Button>
            </form>
          </Form>

          <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-3 border border-slate-100">
            <div className="size-2 bg-primary rounded-full mt-1.5 shrink-0" />
            <p className="text-sm text-slate-500 leading-tight">
              <strong>Pro Tip:</strong> Use a mix of letters, numbers, and symbols to keep your child's data safe.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default UpdatePassword;
