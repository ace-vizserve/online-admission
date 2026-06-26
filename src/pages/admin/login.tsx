import { adminLogin } from "@/actions/admin";
import Logo from "@/components/logo";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { loginSchema, LoginSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";

export default function AdminLogin() {
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: adminLogin,
    onSuccess: () => form.reset(),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full h-full grid lg:grid-cols-2 min-h-screen">
        {/* Form Section */}
        <MaxWidthWrapper className="flex items-center justify-center py-12 px-6">
          <div className="w-full max-w-md space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <Logo className="h-20 w-auto" />
              <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight text-primary">Admin Portal</h1>
                <p className="font-medium text-slate-500 leading-relaxed">
                  Restricted access. Sign in with your admin credentials.
                </p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => mutate(v))} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="name@example.com" autoFocus />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Password
                          </FormLabel>
                          <Link
                            to="/forgot-password"
                            className="text-sm font-bold text-primary hover:underline">
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <PasswordInput {...field} placeholder="••••••••" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  variant="cta"
                  size="lg"
                  disabled={isPending}
                  type="submit"
                  className="w-full">
                  {isPending ? (
                    <div className="flex items-center gap-3">
                      <span>Authenticating</span>
                      <DotPulse size="20" speed="1.3" color="white" />
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </MaxWidthWrapper>

        {/* Visual Section */}
        <div className="hidden lg:flex items-center justify-center bg-slate-50 p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative flex flex-col items-center text-center space-y-6 w-full max-w-sm">
            <div className="absolute -top-10 -left-10 size-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -right-10 size-32 bg-slate-200/60 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col items-center space-y-4">
              <Logo className="h-24 w-auto" />
              <div className="space-y-2">
                <p className="text-xl font-black text-primary tracking-tight">
                  HFSE International School
                </p>
                <p className="text-sm font-medium text-slate-500">
                  Internal Administration System
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
