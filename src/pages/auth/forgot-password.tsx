import { sendPasswordResetLink } from "@/actions/auth";
import Logo from "@/components/logo";
import PageMetaData from "@/components/page-metadata";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FORGOT_PASSWORD_TITLE_DESCRIPTION } from "@/data";
import { forgotPasswordSchema, ForgotPasswordSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";

function ForgotPassword() {
  const { title, description } = FORGOT_PASSWORD_TITLE_DESCRIPTION;
  const form = useForm<ForgotPasswordSchema>({
    defaultValues: { email: "" },
    resolver: zodResolver(forgotPasswordSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: sendPasswordResetLink,
    onSuccess: () => form.reset(),
  });

  function onSubmit(values: ForgotPasswordSchema) {
    mutate(values);
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-lg space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <Logo className="h-20 w-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight text-primary">Reset Password</h1>
              <p className="font-medium text-slate-500 leading-relaxed">
                Enter your email address and we'll send you a secure link to reset your account.
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Registered Email
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="e.g. parent@example.com" autoFocus />
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
                    <span>Sending Link</span>
                    <DotPulse size="20" speed="1.3" color="white" />
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-sm font-bold text-slate-500 hover:text-primary transition-colors inline-flex items-center gap-2">
              <ArrowLeft className="size-4" /> Back to login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
export default ForgotPassword;
