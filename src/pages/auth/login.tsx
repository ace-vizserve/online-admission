import { userLogin } from "@/actions/auth";
import students from "@/assets/students.webp";
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
import SEO, { BASE_URL } from "../seo";

function Login() {
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: userLogin,
    onSuccess: () => form.reset(),
  });

  function onSubmit(values: LoginSchema) {
    mutate(values);
  }

  return (
    <>
      <SEO
        title="HFSE International School Online Admission | Parent Login"
        description="Access your HFSE International School account securely. Log in to VizSchool LMS to manage admissions, courses, and student learning resources."
        canonical={`${BASE_URL}/login`}
        image={students}
        schemaMarkup={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "HFSE International School Online Admission | Parent Login",
          description:
            "Access your HFSE International School account securely. Log in to VizSchool LMS to manage admissions, courses, and student learning resources.",
          url: `${BASE_URL}/login`,
          inLanguage: "en-GB",
          potentialAction: {
            "@type": "LoginAction",
            name: "Login to HFSE Admission Portal",
          },
        }}
      />

      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full h-full grid lg:grid-cols-2 min-h-screen">
          {/* Form Section */}
          <MaxWidthWrapper className="flex items-center justify-center py-12 px-6">
            <div className="w-full max-w-md space-y-8">
              {/* Brand Branding */}
              <div className="flex flex-col items-center text-center space-y-4">
                <Logo className="h-20 w-auto" />
                <div className="space-y-2">
                  <h1 className="text-3xl font-black tracking-tight text-primary">Parent Portal</h1>
                  <p className="font-medium text-slate-500 leading-relaxed">
                    Access your dashboard to manage your child's admission and enrolment.
                  </p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            <Link to="/forgot-password" className="text-sm font-bold text-primary hover:underline">
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
                    disabled={isPending}
                    type="submit"
                    className="w-full h-11 font-bold bg-primary transition-all rounded-xl shadow-lg shadow-slate-200">
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

              <p className="text-center text-sm text-slate-500 font-medium">
                Don&apos;t have an account?{" "}
                <Link to="/registration" className="font-bold text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </MaxWidthWrapper>

          {/* Visual Section */}
          <div className="hidden lg:flex items-center justify-center bg-slate-50 p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-full max-w-lg">
              {/* Decorative Element */}
              <div className="absolute -top-6 -left-6 size-24 bg-primary/10 rounded-full blur-2xl" />

              <img
                src={students}
                alt="Students"
                className="relative z-10 w-full h-auto rounded-3xl shadow-2xl shadow-slate-200 border-8 border-white object-cover"
              />

              <div className="absolute -bottom-6 -right-6 size-32 bg-slate-200/50 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
