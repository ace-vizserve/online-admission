import { AdminAccount, adminSetPassword, listAdminAccounts } from "@/actions/admin";
import PageMetaData from "@/components/page-metadata";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import useSession from "@/hooks/use-session";
import { cn, generatePassword } from "@/lib/utils";
import { AdminSetPasswordSchema, adminSetPasswordSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowLeft, Copy, KeyRound, RefreshCw, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const RELATIONSHIP_LABEL: Record<string, string> = {
  mother: "Mother",
  father: "Father",
  guardian: "Guardian",
};

export default function ResetPassword() {
  const { session } = useSession();
  const [search, setSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<AdminAccount | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: () => listAdminAccounts(session!),
    enabled: !!session,
  });

  const form = useForm<AdminSetPasswordSchema>({
    resolver: zodResolver(adminSetPasswordSchema),
    defaultValues: { email: "", password: generatePassword() },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: AdminSetPasswordSchema) => adminSetPassword(session!, values),
    onSuccess: () => {
      toast.success("Password updated.", {
        description: "Copy the password above and share it with the parent — it won't be shown again.",
      });
      setConfirmOpen(false);
      backToList();
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setConfirmOpen(false);
    },
  });

  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
  }, [accounts, search]);

  const rowVirtualizer = useVirtualizer({
    count: filteredAccounts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });

  function selectAccount(account: AdminAccount) {
    setSelectedAccount(account);
    form.reset({ email: account.email, password: generatePassword() });
  }

  function backToList() {
    setSelectedAccount(null);
    form.reset({ email: "", password: generatePassword() });
  }

  function regeneratePassword() {
    form.setValue("password", generatePassword(), { shouldValidate: true });
  }

  async function copyPassword() {
    const password = form.getValues("password");

    // Clipboard access requires a secure context and isn't implemented on every engine — guard
    // rather than let an unhandled rejection/throw silently drop the click.
    if (!navigator.clipboard?.writeText) {
      toast.error("Clipboard access isn't available in this browser. Please copy the password manually.");
      return;
    }

    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied to clipboard.");
    } catch {
      toast.error("Couldn't copy to clipboard. Please copy the password manually.");
    }
  }

  return (
    <>
      <PageMetaData title="Reset Password | Admin" description="Manually set a new password for a parent account." />

      <div className="animate-in fade-in duration-300 min-h-[calc(100vh-3rem)] flex items-start justify-center py-12 px-6">
        <div className="w-full max-w-lg space-y-8">
          {/* Header */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Admin · Accounts
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Reset password</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Manually set a new password for a parent account when email delivery isn't available.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!selectedAccount ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Parent accounts
                </label>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-8 text-sm"
                    autoFocus
                  />
                </div>

                <div className="rounded-xl border border-border bg-muted/40 overflow-hidden">
                  <div ref={parentRef} className="max-h-96 overflow-y-auto">
                    {accountsLoading ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm font-medium text-muted-foreground">Loading…</p>
                      </div>
                    ) : filteredAccounts.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm font-medium text-muted-foreground">
                          {search ? "No accounts match your search." : "No accounts found."}
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          height: `${rowVirtualizer.getTotalSize()}px`,
                          position: "relative",
                        }}>
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                          const a = filteredAccounts[virtualRow.index];
                          const isLast = virtualRow.index === filteredAccounts.length - 1;
                          return (
                            <div
                              key={a.id}
                              onClick={() => selectAccount(a)}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                              }}
                              className={cn(
                                "flex items-center gap-3 px-4 cursor-pointer select-none transition-colors hover:bg-muted/80",
                                !isLast && "border-b border-border/40",
                              )}>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-foreground truncate">{a.fullName || "—"}</p>
                                <p className="text-[11px] font-mono text-muted-foreground truncate">{a.email}</p>
                              </div>
                              {a.relationship && (
                                <Badge variant="outline" className="text-[10px] font-bold tracking-wider shrink-0">
                                  {RELATIONSHIP_LABEL[a.relationship] ?? a.relationship}
                                </Badge>
                              )}
                              {!a.emailConfirmed && (
                                <Badge variant="secondary" className="text-[10px] font-bold tracking-wider shrink-0">
                                  Unverified
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="space-y-6">
                <button
                  type="button"
                  onClick={backToList}
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3 w-3" />
                  Back to accounts
                </button>

                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate">{selectedAccount.fullName || "—"}</p>
                    <p className="text-[11px] font-mono text-muted-foreground truncate">{selectedAccount.email}</p>
                  </div>
                  {selectedAccount.relationship && (
                    <Badge variant="outline" className="text-[10px] font-bold tracking-wider shrink-0">
                      {RELATIONSHIP_LABEL[selectedAccount.relationship] ?? selectedAccount.relationship}
                    </Badge>
                  )}
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(() => setConfirmOpen(true))} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                              New password
                            </FormLabel>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={regeneratePassword}
                                className="h-6 px-2 text-[11px] font-bold text-muted-foreground hover:text-foreground">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Regenerate
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={copyPassword}
                                className="h-6 px-2 text-[11px] font-bold text-muted-foreground hover:text-foreground">
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                          </div>
                          <FormControl>
                            <PasswordInput {...field} placeholder="Generated password" className="font-mono" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      variant="cta"
                      size="lg"
                      disabled={isPending}
                      className="w-full uppercase tracking-wider">
                      <KeyRound className="h-4 w-4 mr-2" />
                      Set new password
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-foreground">Set this password?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm font-medium text-muted-foreground">
                <p>
                  The account{" "}
                  <span className="font-bold text-foreground">{selectedAccount?.email}</span> will immediately be
                  signed in with the new password shown above.
                </p>
                <p>
                  Make sure you've copied it before continuing — the parent will be prompted to change it after
                  logging in.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={form.handleSubmit((v) => mutate(v))} disabled={isPending}>
              {isPending ? "Setting…" : "Yes, set password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
