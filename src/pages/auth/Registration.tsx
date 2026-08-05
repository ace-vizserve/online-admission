import { userRegister } from "@/actions/auth";
import students from "@/assets/student-images/2.jpg";
import Logo from "@/components/logo";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import PageMetaData from "@/components/page-metadata";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REGISTRATION_PAGE_TITLE_DESCRIPTION } from "@/data";
import { registrationSchema, RegistrationSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";

function Registration() {
  const { title, description } = REGISTRATION_PAGE_TITLE_DESCRIPTION;
  const form = useForm<RegistrationSchema>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      relationship: undefined,
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: userRegister,
    onSettled: () => form.reset(),
  });

  function onSubmit(values: RegistrationSchema) {
    mutate({ ...values, email: values.email.toLowerCase() });
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full h-full grid lg:grid-cols-2 min-h-screen">
          {/* Form Section */}
          <MaxWidthWrapper className="flex items-center justify-center py-12 px-6">
            <div className="w-full space-y-8">
              {/* Branding Header */}
              <div className="flex flex-col items-center text-center space-y-3">
                <Logo className="h-20 w-auto" />
                <div className="space-y-1">
                  <h1 className="text-3xl font-black tracking-tight text-primary">Create Parent Account</h1>
                  <p className="font-medium text-slate-500 leading-relaxed">
                    Join the HFSE community to manage your child's journey.
                  </p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-2 items-start gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            First Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Last Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Relationship to Student
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mother">Mother</SelectItem>
                            <SelectItem value="father">Father</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Password
                          </FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Confirm password
                          </FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    disabled={isPending}
                    type="submit"
                    className="w-full h-11 font-bold text-sm transition-all rounded-xl shadow-lg shadow-slate-200 mt-2">
                    {isPending ? (
                      <div className="flex items-center gap-3">
                        <span>Creating Account</span>
                        <DotPulse size="20" speed="1.3" color="white" />
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-sm text-slate-500 font-medium">
                Already have an account?{" "}
                <Link to="/login" className="font-bold text-primary hover:underline">
                  Sign in
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
              <div className="absolute -top-10 -right-10 size-32 bg-primary/5 rounded-full blur-3xl" />
              <img
                src={students}
                alt="Students"
                className="relative z-10 w-full h-auto rounded-[2rem] shadow-2xl border-[12px] border-white object-cover"
              />
              <div className="absolute -bottom-10 -left-10 size-40 bg-slate-200/40 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Registration;
