import hfseLogo from "@/assets/hfse-logo.webp";
import reportCardFooterBg from "@/assets/report-card-footer-bg.png";
import reportCardHeaderBg from "@/assets/report-card-header-bg.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AttendanceRecord,
  type Cell,
  type CommentRecord,
  type ReportCardPayload,
  useReportCard,
} from "@/hooks/use-report-card";
import { type SchoolConfig, useSchoolConfig } from "@/hooks/use-school-config";
import { ArrowLeft, Globe, Mail, Phone, Printer } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  studentId: never;
  termNumber: number;
  onClose: () => void;
};

export function ReportCardViewer({ studentId, termNumber, onClose }: Props) {
  const state = useReportCard(studentId, termNumber);
  const { data: schoolConfig } = useSchoolConfig();

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="w-7xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (state.status === "error") {
    const msg =
      state.message === "no active publication window for this term"
        ? "This report card is not currently available. The school may have closed the viewing window."
        : "Unable to load report card. Please try again.";
    return (
      <div className="mx-auto px-4 py-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 -ml-2">
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-destructive">{msg}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-7xl mx-auto px-4 py-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 -ml-2">
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button size="sm" onClick={() => window.print()} className="gap-1.5">
          <Printer className="size-4" />
          Print
        </Button>
      </div>
      <ReportCardDocument payload={state.payload} viewingTermNumber={termNumber} schoolConfig={schoolConfig ?? null} />
    </div>
  );
}

function ReportCardDocument({
  payload,
  viewingTermNumber,
  schoolConfig,
}: {
  payload: ReportCardPayload;
  viewingTermNumber: number;
  schoolConfig: SchoolConfig | null;
}) {
  const { ay, terms, student, section, level, subjects, attendance, comments } = payload;
  const earlierComments = payload.earlierComments ?? [];

  const isFinal = viewingTermNumber === 4;

  // T1-T3: show interim terms; T4: show every term the payload carries.
  const visibleTerms = isFinal ? terms : terms.filter((t) => t.term_number <= 3);

  const generalAverage = isFinal
    ? computeGeneralAverage(subjects.filter((r) => r.subject.is_examinable).map((r) => r.annual))
    : null;

  const attendancePct = isFinal ? computeAttendancePercentage(attendance) : null;

  return (
    <article
      id="report-card-print"
      className="w-7xl mx-auto w-full max-w-[8.5in] overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <Letterhead config={schoolConfig} />

      <div className="space-y-8 px-4 py-6 sm:px-8 sm:py-8 lg:px-10 print:px-8 print:py-6">
        <header className="flex flex-col items-center gap-1 border-b border-border pb-5 text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {ay.label}
          </p>
          <h1 className="font-serif text-[26px] font-semibold leading-tight tracking-tight text-foreground">
            Student Progress Report
          </h1>
        </header>

        {/* Student info card */}
        <section className="rounded-xl border border-border bg-muted/40 p-5 print:break-inside-avoid">
          <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Student
          </p>
          <div className="grid grid-cols-1 gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
            {isFinal ? (
              <>
                <InfoRow label="Name" value={student.full_name} />
                <InfoRow label="Grade Level" value={level.label} />
                <InfoRow label="Section" value={section.name} />
                <InfoRow label="Teacher" value={section.form_class_adviser ?? "—"} />
              </>
            ) : (
              <>
                <InfoRow label="Student Name" value={student.full_name} />
                <InfoRow label="Course" value={level.label} />
                <InfoRow label="Class" value={section.name} />
                <InfoRow label="Form Class Adviser" value={section.form_class_adviser ?? "—"} />
              </>
            )}
          </div>
        </section>

        {/* Academic grades */}
        <section className="space-y-3 print:break-inside-avoid">
          <SectionHeading>{isFinal ? "Academic Results" : "Academic Grades"}</SectionHeading>
          <div className="-mx-4 overflow-x-auto rounded-none border-y border-border sm:mx-0 sm:overflow-hidden sm:rounded-xl sm:border print:mx-0 print:overflow-hidden print:rounded-xl print:border">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5">{isFinal ? "Subjects" : "Subject"}</th>
                  {visibleTerms.map((t) => (
                    <th key={t.id} className="w-14 py-2.5 text-center">
                      Term {t.term_number}
                    </th>
                  ))}
                  {isFinal && <th className="w-20 py-2.5 text-center">Final Grade</th>}
                </tr>
              </thead>
              <tbody>
                {subjects.map((row) => (
                  <tr key={row.subject.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{row.subject.name}</td>
                    {visibleTerms.map((t) => {
                      const termKey = `t${t.term_number}` as "t1" | "t2" | "t3" | "t4";
                      return (
                        <td key={t.id} className="py-2 text-center tabular-nums">
                          {cellText(row[termKey], row.subject.is_examinable)}
                        </td>
                      );
                    })}
                    {isFinal && (
                      <td className="py-2 text-center font-serif text-base font-semibold tabular-nums text-foreground">
                        {row.subject.is_examinable ? (row.annual ?? "—") : (row.annual_letter ?? "—")}
                      </td>
                    )}
                  </tr>
                ))}
                {subjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={visibleTerms.length + 1 + (isFinal ? 1 : 0)}
                      className="py-6 text-center text-sm text-muted-foreground">
                      No subjects configured for {level.label}.
                    </td>
                  </tr>
                )}
              </tbody>
              {isFinal && generalAverage != null && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/40">
                    <td
                      colSpan={visibleTerms.length + 1}
                      className="px-4 py-2.5 text-right font-serif text-sm font-semibold tracking-tight text-foreground">
                      General Average
                    </td>
                    <td className="py-2.5 text-center font-serif text-base font-semibold tabular-nums text-foreground">
                      {generalAverage.toFixed(1)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        {/* Grading legend */}
        <section className="rounded-xl border border-border bg-accent/50 p-4 text-xs text-muted-foreground print:break-inside-avoid">
          <div className="grid grid-cols-1 gap-x-8 gap-y-0.5 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                Legend (Examinable Subjects)
              </p>
              <div>Outstanding · 90–100</div>
              <div>Very Satisfactory · 85–89</div>
              <div>Satisfactory · 80–84</div>
              <div>Fairly Satisfactory · 75–79</div>
              <div>Below Minimum Expectations · Below 75</div>
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                Legend (Non-Examinable Subjects)
              </p>
              <div>A — Fully demonstrated the skills required (90 to 100)</div>
              <div>B — Demonstrated some skills required (85 to 89)</div>
              <div>C — Fairly demonstrated the skill required (80 to 84)</div>
              <div>IP — In Progress (79 and below)</div>
              <div>UG — Ungraded</div>
              <div>N.A. — Not Applicable</div>
            </div>
          </div>
        </section>

        {/* School Attendance */}
        <section className="space-y-3 print:break-inside-avoid">
          <SectionHeading>School Attendance</SectionHeading>
          <div className="-mx-4 overflow-x-auto rounded-none border-y border-border sm:mx-0 sm:overflow-hidden sm:rounded-xl sm:border print:mx-0 print:overflow-hidden print:rounded-xl print:border">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5"></th>
                  {visibleTerms.map((t) => (
                    <th key={t.id} className="py-2.5 text-center">
                      Term {t.term_number}
                    </th>
                  ))}
                  {isFinal && <th className="py-2.5 text-center">Percentage</th>}
                </tr>
              </thead>
              <tbody>
                {ATTENDANCE_ROWS.map(({ key, label }) => (
                  <tr key={key} className="border-t border-border">
                    <td className="px-4 py-2 text-muted-foreground">{label}</td>
                    {visibleTerms.map((t) => {
                      const rec = attendance.find((a: AttendanceRecord) => a.term_id === t.id);
                      const val = rec?.[key] ?? null;
                      return (
                        <td key={t.id} className="py-2 text-center tabular-nums">
                          {val ?? "N.A."}
                        </td>
                      );
                    })}
                    {isFinal && (
                      <td className="py-2 text-center font-semibold tabular-nums">
                        {key === "days_present" && attendancePct != null
                          ? `${attendancePct}%`
                          : key === "days_late"
                            ? "N.A."
                            : ""}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Form Class Adviser's Comments — cumulative: earlier terms from `earlierComments`
            (each carrying its own label and virtue theme, since `terms` holds only the viewed
            term), then the viewed term's own comment last. Terms without a submitted comment are
            omitted — a mid-year joiner legitimately has fewer. T4 final has no FCA block. */}
        {!isFinal &&
          (() => {
            const boxes = earlierComments.map((c) => ({
              key: c.term_id,
              label: c.term_label,
              virtue: c.virtue_theme?.trim() || null,
              comment: c.comment,
            }));

            // The viewed term still arrives in `terms`/`comments`, not in `earlierComments`.
            const viewedTerm = terms.find((t) => t.term_number === viewingTermNumber);
            const viewedComment =
              comments.find((c: CommentRecord) => c.term_id === viewedTerm?.id)?.comment?.trim() || null;
            if (viewedTerm && viewedComment) {
              boxes.push({
                key: viewedTerm.id,
                label: viewedTerm.label,
                virtue: viewedTerm.virtue_theme?.trim() || null,
                comment: viewedComment,
              });
            }

            if (boxes.length === 0) return null;

            return (
              <section className="space-y-3">
                <SectionHeading>Form Class Adviser&apos;s Comments</SectionHeading>
                <div className="space-y-2.5">
                  {boxes.map((box) => (
                    <div key={box.key} className="rounded-xl border border-border p-4 print:break-inside-avoid">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {box.label}
                        {box.virtue ? (
                          <span className="font-sans normal-case tracking-normal text-muted-foreground">
                            {" "}
                            (HFSE Virtues: {box.virtue})
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {box.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

        {/* Signatures */}
        <section className="pt-2 text-xs text-muted-foreground print:break-inside-avoid">
          {isFinal ? (
            <div className="grid grid-cols-3 gap-6 sm:gap-8">
              <SignatureSlot name={section.form_class_adviser ?? "Form Teacher"} role="Form Teacher" />
              <SignatureSlot name={schoolConfig?.principal_name || " "} role="School Principal" />
              <SignatureSlot name={schoolConfig?.ceo_name || " "} role="Founder & CEO" />
            </div>
          ) : (
            <div className="mx-auto max-w-xs">
              <div className="h-12 border-b border-border"></div>
              <p className="mt-2 text-center font-medium text-foreground">&nbsp;</p>
              <p className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">
                Parent&apos;s Signature
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="px-6">
        <img src={reportCardFooterBg} alt="HFSE Global Education Group affiliates" className="block w-full" />
      </div>
    </article>
  );
}

function formatPeiDate(iso: string | null): string | null {
  if (!iso) return null;
  // Append T00:00:00 so Date parses in local time, not UTC.
  return new Date(iso + "T00:00:00").toLocaleString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Letterhead({ config }: { config: SchoolConfig | null }) {
  const start = formatPeiDate(config?.pei_registration_start_date ?? null);
  const end = formatPeiDate(config?.pei_registration_end_date ?? null);
  const peiPeriod = start && end ? `${start} – ${end}` : null;
  const showPei = config?.pei_registration_number || peiPeriod;

  return (
    <div className="flex w-full overflow-hidden [print-color-adjust:exact]" style={{ aspectRatio: "1166 / 186" }}>
      {/* Logo — over the white left area of the header background */}
      <div className="flex w-[27%] shrink-0 items-center justify-center px-4 py-3">
        <img
          src={config?.logo_url || hfseLogo}
          alt={config?.organization_name || "School logo"}
          className="h-auto w-full max-w-[200px] object-contain"
          style={{ maxHeight: "80%" }}
        />
      </div>

      {/* Info — over the dark band of the header background (bg-primary fallback if the PNG is absent) */}
      <div
        className="flex w-full flex-1 flex-col justify-center gap-0.5 bg-primary px-6 py-4 text-right text-white"
        style={{
          backgroundImage: `url('${reportCardHeaderBg}')`,
          backgroundSize: "100% 100%",
        }}>
        {config?.organization_name && (
          <p className="font-sans text-[14px] font-bold leading-tight text-white">{config.organization_name}</p>
        )}
        {config?.address_line_1 && <p className="text-[10px] leading-tight text-white">{config.address_line_1}</p>}
        {config?.address_line_2 && <p className="text-[10px] leading-tight text-white">{config.address_line_2}</p>}
        {(config?.phone_number || config?.website_url || config?.contact_email) && (
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-0.5 text-[10px] text-white">
            {config?.phone_number && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3 shrink-0" />
                {config.phone_number}
              </span>
            )}
            {config?.website_url && (
              <span className="inline-flex items-center gap-1">
                <Globe className="size-3 shrink-0" />
                {config.website_url.replace(/^https?:\/\//, "")}
              </span>
            )}
            {config?.contact_email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3 shrink-0" />
                {config.contact_email}
              </span>
            )}
          </div>
        )}
        {showPei && (
          <>
            <p className="text-[10px] leading-tight text-white/90">
              {config?.pei_registration_number ? `PEI Registration No. ${config.pei_registration_number}` : null}
            </p>
            <p className="text-[10px] leading-tight text-white/90">
              {peiPeriod ? `Registration Period: ${peiPeriod}` : null}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const ATTENDANCE_ROWS: {
  key: "school_days" | "days_present" | "days_late";
  label: string;
}[] = [
  { key: "school_days", label: "Number of School Days" },
  { key: "days_present", label: "Number of Days Present" },
  { key: "days_late", label: "Number of Days Late" },
];

function computeGeneralAverage(annuals: (number | null)[]): number | null {
  const values = annuals.filter((n): n is number => n != null);
  if (values.length === 0) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function computeAttendancePercentage(attendance: AttendanceRecord[]): number | null {
  const totalDays = attendance.reduce((sum, r) => sum + (r.school_days ?? 0), 0);
  const present = attendance.reduce((sum, r) => sum + (r.days_present ?? 0), 0);
  if (totalDays === 0) return null;
  return Math.round((present / totalDays) * 100);
}

function cellText(cell: Cell, examinable: boolean): string {
  if (cell.is_na) return "N.A.";
  if (!examinable) return cell.letter ?? "—";
  return cell.quarterly != null ? String(cell.quarterly) : "—";
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="font-serif text-[15px] font-semibold tracking-tight text-foreground">{children}</h2>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <div className="w-28 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:w-36">
        {label}
      </div>
      <div className="flex-1 font-medium text-foreground">{value}</div>
    </div>
  );
}

function SignatureSlot({ name, role }: { name: string; role: string }) {
  return (
    <div>
      <div className="h-12 border-b border-border"></div>
      <p className="mt-2 font-medium text-foreground">{name}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{role}</p>
    </div>
  );
}
