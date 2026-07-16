import {
  RECOVERY_SECTION_LABEL,
  RecoveryCheckResult,
  RecoveryLinkResult,
  RecoverySection,
  RecoveryTokenSummary,
  adminCheckRecovery,
  adminGenerateRecoveryLink,
  adminListRecoveryLinks,
} from "@/actions/admin";
import PageMetaData from "@/components/page-metadata";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import useSession from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { AdminRecoveryLookupSchema, adminRecoveryLookupSchema, recoveryRecipientEmailsSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, CircleCheck, Clock, Copy, Mail, Search, TriangleAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const FIELD_LABEL = "text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground";

const TABLE_LABEL: Record<string, string> = {
  applications: "Applications",
  documents: "Documents",
  status: "Status",
};

const RECOVERY_SECTIONS: RecoverySection[] = ["studentInfo", "familyInfo", "enrollmentInfo", "uploads"];

function TableBadge({ label, present, sublabel }: { label: string; present: boolean; sublabel?: string }) {
  return (
    <Badge
      variant={present ? "outline" : "destructive"}
      className="text-[10px] font-bold tracking-wider gap-1 shrink-0">
      {present ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
      {sublabel && <span className="font-normal normal-case">· {sublabel}</span>}
    </Badge>
  );
}

type TokenStatus = "Completed" | "Expired" | "Pending";

function tokenStatus(t: RecoveryTokenSummary): TokenStatus {
  if (t.used_at) return "Completed";
  if (new Date(t.expires_at).getTime() < Date.now()) return "Expired";
  return "Pending";
}

function StatusBadge({ status }: { status: TokenStatus }) {
  const config: Record<TokenStatus, { variant: "outline" | "secondary"; icon: typeof Check; className: string }> = {
    Completed: { variant: "outline", icon: CircleCheck, className: "text-primary border-primary/30" },
    Pending: { variant: "outline", icon: Clock, className: "text-amber-700 border-amber-500/30" },
    Expired: { variant: "secondary", icon: X, className: "text-muted-foreground" },
  };
  const { variant, icon: Icon, className } = config[status];
  return (
    <Badge variant={variant} className={cn("text-[10px] font-bold tracking-wider gap-1 shrink-0", className)}>
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

export default function RecoveryLink() {
  const { session } = useSession();
  const [checkResult, setCheckResult] = useState<RecoveryCheckResult | null>(null);
  const [linkResult, setLinkResult] = useState<RecoveryLinkResult | null>(null);
  const [selectedSections, setSelectedSections] = useState<Set<RecoverySection>>(new Set(RECOVERY_SECTIONS));
  const [recipientEmails, setRecipientEmails] = useState("");

  const form = useForm<AdminRecoveryLookupSchema>({
    resolver: zodResolver(adminRecoveryLookupSchema),
    defaultValues: { enroleeNumber: "" },
  });

  const { data: recentLinks, refetch: refetchRecentLinks } = useQuery({
    queryKey: ["recovery-links"],
    queryFn: () => adminListRecoveryLinks(session!),
    enabled: Boolean(session),
  });

  const { mutate: check, isPending: isChecking } = useMutation({
    mutationFn: (values: AdminRecoveryLookupSchema) => adminCheckRecovery(session!, values),
    onSuccess: (result) => {
      setCheckResult(result);
      setLinkResult(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Pre-check whichever tabs the server determined are actually incomplete once a check
  // resolves — the admin can still narrow further before generating the link. Also prefill
  // the recipient field from whatever's already on the applications row, if it exists — the
  // admin still sees and can edit this before anything is actually sent.
  useEffect(() => {
    if (checkResult && !("complete" in checkResult && checkResult.complete)) {
      setSelectedSections(new Set(checkResult.suggestedSections));
      setRecipientEmails(checkResult.knownEmails ?? "");
    }
  }, [checkResult]);

  const recipientEmailsValid = recoveryRecipientEmailsSchema.safeParse({ recipientEmails }).success;

  // The record can only be scoped to a subset of tabs once _applications actually exists —
  // otherwise the link has to insert a full row (mirrors the same guard in the edge function).
  const applicationsExist = Boolean(
    checkResult && !("complete" in checkResult && checkResult.complete) && checkResult.present.applications,
  );

  const { mutate: generate, isPending: isGenerating } = useMutation({
    mutationFn: () =>
      adminGenerateRecoveryLink(session!, {
        enroleeNumber: form.getValues("enroleeNumber"),
        sections: applicationsExist ? Array.from(selectedSections) : undefined,
        recipientEmails,
      }),
    onSuccess: (result) => {
      setLinkResult(result);
      refetchRecentLinks();
      if (result.emailSent) {
        toast.success("Recovery link generated and emailed.");
      } else {
        toast.warning("Recovery link generated, but the email didn't send.", {
          description: result.emailError ?? "Copy the link below and send it manually.",
        });
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function toggleSection(section: RecoverySection, checked: boolean) {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (checked) next.add(section);
      else next.delete(section);
      return next;
    });
  }

  function onSubmit(values: AdminRecoveryLookupSchema) {
    setCheckResult(null);
    setLinkResult(null);
    setRecipientEmails("");
    check(values);
  }

  async function copyToClipboard(url: string) {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard.");
  }

  const isComplete = checkResult && "complete" in checkResult && checkResult.complete;
  const isIncomplete = checkResult && !("complete" in checkResult && checkResult.complete);

  return (
    <>
      <PageMetaData
        title="Recovery Link | Admin"
        description="Generate a shareable link for a parent to complete a partial enrolment record."
      />

      <div className="animate-in fade-in duration-300 min-h-[calc(100vh-3rem)] flex items-start justify-center py-12 px-6">
        <div className="w-full max-w-lg space-y-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Admin · Enrolments
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Recovery link</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Check which tables are missing for an enrolee number, then generate a one-time link for the parent to
              complete the record — no login required.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="enroleeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={FIELD_LABEL}>Enrolee number</FormLabel>
                    <FormControl>
                      <Input placeholder="E270003" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                variant="cta"
                size="lg"
                disabled={isChecking}
                className="w-full uppercase tracking-wider">
                <Search className="h-4 w-4 mr-2" />
                {isChecking ? "Checking…" : "Check record"}
              </Button>
            </form>
          </Form>

          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="rounded-xl border border-border bg-muted/40 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3">
                  <CircleCheck className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm font-black text-foreground">All three tables are already present</p>
                </div>
                <div className="px-5 pb-4">
                  <p className="text-[11px] font-medium text-muted-foreground">Nothing to recover for this record.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isIncomplete && checkResult && !("complete" in checkResult && checkResult.complete) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="rounded-xl border border-destructive/30 bg-destructive/5 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-destructive/20">
                  <TriangleAlert className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-sm font-black text-destructive">Incomplete record</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{checkResult.studentName ?? "—"}</p>
                    <p className="text-[11px] font-mono text-muted-foreground truncate">
                      {checkResult.enroleeNumber} · {checkResult.category}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["applications", "documents", "status"] as const).map((key) => (
                      <TableBadge
                        key={key}
                        label={TABLE_LABEL[key]}
                        present={checkResult.present[key]}
                        sublabel={key === "applications" && checkResult.applicationsIncomplete ? "incomplete" : undefined}
                      />
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className={FIELD_LABEL}>Which tabs should the parent complete?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {RECOVERY_SECTIONS.map((section) => (
                        <label
                          key={section}
                          className="flex items-center gap-2 text-xs font-medium text-foreground">
                          <Checkbox
                            checked={applicationsExist ? selectedSections.has(section) : true}
                            disabled={!applicationsExist}
                            onCheckedChange={(checked) => toggleSection(section, checked === true)}
                          />
                          {RECOVERY_SECTION_LABEL[section]}
                        </label>
                      ))}
                    </div>
                    {!applicationsExist && (
                      <p className="text-[11px] font-medium text-muted-foreground">
                        Applications doesn't exist yet — the link has to collect the full application.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className={FIELD_LABEL} htmlFor="recipientEmails">
                      Send to (comma-separated for multiple)
                    </label>
                    <Input
                      id="recipientEmails"
                      placeholder="mother@example.com, father@example.com"
                      value={recipientEmails}
                      onChange={(e) => setRecipientEmails(e.target.value)}
                    />
                    {recipientEmails.length > 0 && !recipientEmailsValid && (
                      <p className="text-[11px] font-medium text-destructive">
                        Enter a valid email address for every recipient.
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="cta"
                    size="lg"
                    disabled={
                      isGenerating || (applicationsExist && selectedSections.size === 0) || !recipientEmailsValid
                    }
                    onClick={() => generate()}
                    className="w-full uppercase tracking-wider">
                    <Mail className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generating…" : "Generate & send"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {linkResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={cn(
                  "rounded-xl border overflow-hidden",
                  linkResult.emailSent ? "border-border bg-muted/40" : "border-amber-500/30 bg-amber-500/5",
                )}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 border-b",
                    linkResult.emailSent ? "border-border" : "border-amber-500/20",
                  )}>
                  {linkResult.emailSent ? (
                    <CircleCheck className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <TriangleAlert className="h-4 w-4 text-amber-600 shrink-0" />
                  )}
                  <p className="text-sm font-black text-foreground">
                    {linkResult.emailSent ? "Link ready and emailed — expires in 7 days" : "Link ready — email not sent"}
                  </p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                    <p className="text-[11px] font-mono text-foreground truncate flex-1">{linkResult.url}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => linkResult && copyToClipboard(linkResult.url)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {linkResult.emailSent ? (
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Emailed to {recipientEmails}. Tabs shown on the link:{" "}
                      {linkResult.sections.map((s) => RECOVERY_SECTION_LABEL[s]).join(", ")}.
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium text-amber-700">
                      {linkResult.emailError ?? "The email failed to send."} Copy the link above and send it manually.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {recentLinks && recentLinks.length > 0 && (
            <div className="space-y-3">
              <p className={FIELD_LABEL}>Recent links</p>
              <div className="space-y-2">
                {recentLinks.map((t) => {
                  const status = tokenStatus(t);
                  return (
                    <div
                      key={t.token}
                      className="rounded-lg border border-border bg-background px-3 py-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {t.student_name ?? t.enrolee_number}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">
                            {t.enrolee_number} · {t.category} · {new Date(t.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusBadge status={status} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-medium text-muted-foreground truncate">
                          {t.notified_email ? `Sent to ${t.notified_email}` : "Not emailed"}
                          {status === "Completed" && t.used_at && ` · Completed ${new Date(t.used_at).toLocaleDateString()}`}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => copyToClipboard(t.url)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
