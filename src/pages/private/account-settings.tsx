import { updateAccountName, updatePassword } from "@/actions/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import useSession from "@/hooks/use-session";
import {
  updateAccountNameSchema,
  UpdateAccountNameSchema,
  updatePasswordSchema,
  UpdatePasswordSchema,
} from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { KeyRound, Mail, Pen, ShieldAlert, Sparkles, User } from "lucide-react";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function AccountSettings() {
  const { session } = useSession();
  const passwordChanged = session?.user.user_metadata?.password_changed as boolean | undefined;
  const showPasswordWarning = passwordChanged != null && !passwordChanged;

  const nameParts = session?.user.user_metadata.fullName.replace(/,/g, "").split(" ") as string[];

  const fullName = nameParts.reverse().join(" ");
  const email = session?.user.email ?? "";
  const initials =
    nameParts.length >= 2 ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase() : (fullName[0]?.toUpperCase() ?? "?");
  const displayName = nameParts.length >= 2 ? `${nameParts[0]} ${nameParts[1]}` : fullName;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-screen-md mx-auto w-full flex flex-col gap-6 py-4 md:py-8 px-4 md:px-6">
      {/* Hero Header */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-blue-700 p-6 md:p-8 shadow-xl border-b-4 border-blue-900">
        {/* Decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative flex items-center gap-5">
          <div className="flex items-center justify-center size-16 md:size-[4.5rem] rounded-2xl bg-white/15 backdrop-blur-sm text-white text-2xl md:text-3xl font-black shrink-0 ring-2 ring-white/20 shadow-lg">
            {initials}
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white truncate capitalize">
              {displayName.toLowerCase()}
            </h1>
            <p className="text-sm text-blue-100 font-medium truncate flex items-center gap-1.5">
              <Mail className="size-3.5 shrink-0" />
              {email}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={fadeUp}>
        <ProfileSection />
      </motion.div>

      {/* Security Card */}
      <motion.div variants={fadeUp}>
        <SecuritySection showWarning={showPasswordWarning} />
      </motion.div>
    </motion.div>
  );
}

function ProfileSection() {
  const { session } = useSession();

  const nameParts = session?.user.user_metadata.fullName.replace(/,/g, "").split(" ") as string[];

  const form = useForm<UpdateAccountNameSchema>({
    defaultValues: {
      lastName: nameParts[0] ?? "",
      firstName: nameParts[1] ?? "",
      middleName: nameParts[2] ?? "",
    },
    resolver: zodResolver(updateAccountNameSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: updateAccountName,
  });

  function onSubmit(values: UpdateAccountNameSchema) {
    mutate(values);
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 md:px-8 pt-6 md:pt-8 pb-4">
        <div className="rounded-lg bg-primary p-2 text-white">
          <User />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">Personal Information</h2>
          <p className="text-xs text-muted-foreground font-medium">Update how your name appears on your account.</p>
        </div>
      </div>

      <Separator />

      <div className="p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5 ">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Juan"
                        {...field}
                        className="h-11 rounded-xl border-border/80 focus-visible:ring-primary/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>
                      Middle name{" "}
                      <span className="font-medium normal-case tracking-normal text-muted-foreground/70">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Santos"
                        {...field}
                        className="h-11 rounded-xl border-border/80 focus-visible:ring-primary/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Dela Cruz"
                        {...field}
                        className="h-11 rounded-xl border-border/80 focus-visible:ring-primary/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="!mt-6" />

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Sparkles className="size-3" />
                Changes update your display name across the portal.
              </p>
              <Button
                disabled={isPending}
                type="submit"
                className="h-10 rounded-xl px-5 font-bold transition-all active:scale-[0.97] shadow-sm">
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <span>Saving</span>
                    <DotPulse size="18" speed="1.3" color="white" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Pen className="size-3.5" />
                    <span>Save changes</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

function SecuritySection({ showWarning }: { showWarning: boolean }) {
  const form = useForm<UpdatePasswordSchema>({
    defaultValues: { password: "" },
    resolver: zodResolver(updatePasswordSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: updatePassword,
    onSuccess() {
      form.setValue("password", "");
    },
  });

  function onSubmit(values: UpdatePasswordSchema) {
    mutate(values);
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 md:px-8 pt-6 md:pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary p-2 text-white">
            <KeyRound />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight">Password & Security</h2>
            <p className="text-xs text-muted-foreground font-medium">
              Keep your account protected with a strong password.
            </p>
          </div>
        </div>

        {showWarning && (
          <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-widest bg-destructive text-white px-2 py-1 rounded-md animate-pulse">
            Action Required
          </span>
        )}
      </div>

      <Separator />

      <div className="p-6 md:p-8 space-y-5">
        {showWarning && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400 rounded-xl">
            <ShieldAlert />
            <AlertTitle className="font-bold">You're using a temporary password.</AlertTitle>
            <AlertDescription>For your security, please set a new password below.</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      id="new-password"
                      placeholder="Minimum 8 characters"
                      {...field}
                      className="h-11 rounded-xl border-border/80 focus-visible:ring-primary/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="!mt-6" />

            <div className="flex justify-end pt-1">
              <Button
                disabled={isPending}
                type="submit"
                className="h-10 rounded-xl px-5 font-bold transition-all active:scale-[0.97] shadow-sm">
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <span>Updating</span>
                    <DotPulse size="18" speed="1.3" color="white" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <KeyRound className="size-3.5" />
                    <span>Update password</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default AccountSettings;
