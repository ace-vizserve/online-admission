import {
  CreatedParentAccount,
  ExistingParentAccount,
  ExistingParentAccountError,
  adminCreateParentAccount,
} from "@/actions/admin";
import PageMetaData from "@/components/page-metadata";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useSession from "@/hooks/use-session";
import { AdminCreateParentSchema, adminCreateParentSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CircleCheck, TriangleAlert, UserPlus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const RELATIONSHIP_LABEL: Record<string, string> = {
  mother: "Mother",
  father: "Father",
  guardian: "Guardian",
};

const FIELD_LABEL = "text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground";

const DEFAULT_VALUES: AdminCreateParentSchema = {
  firstName: "",
  lastName: "",
  relationship: undefined as unknown as AdminCreateParentSchema["relationship"],
  email: "",
  password: "",
  confirmPassword: "",
};

export default function CreateParent() {
  const { session } = useSession();
  const [existing, setExisting] = useState<ExistingParentAccount | null>(null);
  const [created, setCreated] = useState<CreatedParentAccount | null>(null);

  const form = useForm<AdminCreateParentSchema>({
    resolver: zodResolver(adminCreateParentSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: AdminCreateParentSchema) => adminCreateParentAccount(session!, values),
    onSuccess: (account) => {
      setCreated(account);
      form.reset(DEFAULT_VALUES);
      toast.success("Parent account created.", {
        description: "Share the password with the parent — they'll be asked to change it on first login.",
      });
    },
    onError: (err: Error) => {
      if (err instanceof ExistingParentAccountError) {
        setExisting(err.existing);
        return;
      }
      toast.error(err.message);
    },
  });

  function onSubmit(values: AdminCreateParentSchema) {
    setExisting(null);
    setCreated(null);
    mutate(values);
  }

  return (
    <>
      <PageMetaData title="Create Parent Account | Admin" description="Create a parent account on a parent's behalf." />

      <div className="animate-in fade-in duration-300 min-h-[calc(100vh-3rem)] flex items-start justify-center py-12 px-6">
        <div className="w-full max-w-lg space-y-8">
          {/* Header */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Admin · Accounts
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Create parent account</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Set up an account on a parent's behalf. It's usable immediately — no email verification — and the parent
              is asked to change the password on first login.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 items-start gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={FIELD_LABEL}>First name</FormLabel>
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
                      <FormLabel className={FIELD_LABEL}>Last name</FormLabel>
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
                    <FormLabel className={FIELD_LABEL}>Relationship to student</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a role" />
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
                    <FormLabel className={FIELD_LABEL}>Email address</FormLabel>
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
                      <FormLabel className={FIELD_LABEL}>Temporary password</FormLabel>
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
                      <FormLabel className={FIELD_LABEL}>Confirm password</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                variant="cta"
                size="lg"
                disabled={isPending}
                className="w-full uppercase tracking-wider">
                <UserPlus className="h-4 w-4 mr-2" />
                {isPending ? "Creating…" : "Create account"}
              </Button>
            </form>
          </Form>

          {/* Existing-account details — the idempotency result */}
          <AnimatePresence>
            {existing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="rounded-xl border border-destructive/30 bg-destructive/5 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-destructive/20">
                  <TriangleAlert className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-sm font-black text-destructive">An account with this email already exists</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">{existing.fullName || "—"}</p>
                      <p className="text-[11px] font-mono text-muted-foreground truncate">{existing.email}</p>
                    </div>
                    {existing.relationship && (
                      <Badge variant="outline" className="text-[10px] font-bold tracking-wider shrink-0">
                        {RELATIONSHIP_LABEL[existing.relationship] ?? existing.relationship}
                      </Badge>
                    )}
                    {!existing.emailConfirmed && (
                      <Badge variant="secondary" className="text-[10px] font-bold tracking-wider shrink-0">
                        Unverified
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-medium text-muted-foreground">
                    <p>
                      Created:{" "}
                      <span className="font-bold text-foreground">
                        {existing.createdAt ? new Date(existing.createdAt).toLocaleDateString() : "—"}
                      </span>
                    </p>
                    <p>
                      Last sign-in:{" "}
                      <span className="font-bold text-foreground">
                        {existing.lastSignInAt ? new Date(existing.lastSignInAt).toLocaleDateString() : "Never"}
                      </span>
                    </p>
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    No new account was created. Use the Reset Password page if the parent lost access.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Created confirmation */}
          <AnimatePresence>
            {created && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="rounded-xl border border-border bg-muted/40 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
                  <CircleCheck className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm font-black text-foreground">Account created</p>
                </div>
                <div className="px-5 py-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">{created.fullName}</p>
                      <p className="text-[11px] font-mono text-muted-foreground truncate">{created.email}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold tracking-wider shrink-0">
                      {RELATIONSHIP_LABEL[created.relationship] ?? created.relationship}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    The password you set is temporary — the parent will be asked to change it after their first login.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
