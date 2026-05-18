import { Button, buttonVariants } from "@/components/ui/button";
import StatusBadge, { StatusProps } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { FamilyDocument } from "@/types";
import { format } from "date-fns";
import { Eye, EyeClosed, FileText, Heart, User, Users } from "lucide-react";
import React from "react";
import { Link } from "react-router";

function FamilyDocuments({
  label,
  documents,
  noFatherInfo,
  noGuardianInfo,
}: {
  label: string;
  documents?: FamilyDocument;
  noFatherInfo?: boolean;
  noGuardianInfo?: boolean;
}) {
  const motherCards = [
    {
      role: "mother",
      label: "Mother's Passport",
      fileUrl: documents?.motherPassport ?? undefined,
      status: documents?.motherPassportStatus ?? undefined,
      expiry: documents?.motherPassportExpiry ?? undefined,
      typeLabel: documents?.motherPassportNumber ?? undefined,
      documentType: "motherPassport",
      payload: {
        motherPassport: documents?.motherPassport,
        motherPassportNumber: documents?.motherPassportNumber,
        motherPassportExpiry: documents?.motherPassportExpiry,
      },
    },
    {
      role: "mother",
      label: "Mother's Pass",
      fileUrl: documents?.motherPass ?? undefined,
      status: documents?.motherPassStatus ?? undefined,
      expiry: documents?.motherPassExpiry ?? undefined,
      typeLabel: documents?.motherPassType ?? undefined,
      documentType: "motherPass",
      payload: {
        motherPass: documents?.motherPass,
        motherPassType: documents?.motherPassType,
        motherPassExpiry: documents?.motherPassExpiry,
      },
    },
  ];

  const fatherCards = [
    {
      role: "father",
      label: "Father's Passport",
      fileUrl: documents?.fatherPassport ?? undefined,
      status: documents?.fatherPassportStatus ?? undefined,
      expiry: documents?.fatherPassportExpiry ?? undefined,
      typeLabel: documents?.fatherPassportNumber ?? undefined,
      documentType: "fatherPassport",
      payload: {
        fatherPassport: documents?.fatherPassport,
        fatherPassportNumber: documents?.fatherPassportNumber,
        fatherPassportExpiry: documents?.fatherPassportExpiry,
      },
    },
    {
      role: "father",
      label: "Father's Pass",
      fileUrl: documents?.fatherPass ?? undefined,
      status: documents?.fatherPassStatus ?? undefined,
      expiry: documents?.fatherPassExpiry ?? undefined,
      typeLabel: documents?.fatherPassType ?? undefined,
      documentType: "motherPass",
      payload: {
        fatherPass: documents?.fatherPass,
        fatherPassType: documents?.fatherPassType,
        fatherPassExpiry: documents?.fatherPassExpiry,
      },
    },
  ];

  const guardianCards = [
    {
      role: "guardian",
      label: "Guardian's Passport",
      fileUrl: documents?.guardianPassport ?? undefined,
      status: documents?.guardianPassportStatus ?? undefined,
      expiry: documents?.guardianPassportExpiry ?? undefined,
      typeLabel: documents?.guardianPassportNumber ?? undefined,
      documentType: "guardianPassport",
      payload: {
        guardianPassport: documents?.guardianPassport,
        guardianPassportNumber: documents?.guardianPassportNumber,
        guardianPassportExpiry: documents?.guardianPassportExpiry,
      },
    },
    {
      role: "guardian",
      label: "Guardian's Pass",
      fileUrl: documents?.guardianPass ?? undefined,
      status: documents?.guardianPassStatus ?? undefined,
      expiry: documents?.guardianPassExpiry ?? undefined,
      typeLabel: documents?.guardianPassType ?? undefined,
      documentType: "guardianPass",
      payload: {
        guardianPass: documents?.guardianPass,
        guardianPassType: documents?.guardianPassType,
        guardianPassExpiry: documents?.guardianPassExpiry,
      },
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-1">
        <h1 className="font-black text-2xl md:text-4xl text-slate-900 tracking-tight">{label}</h1>
        <p className="text-sm font-medium text-slate-500">
          This section includes details about the student's parens/guardian documents for this current school year.
        </p>
      </div>

      <section className="space-y-6">
        <SectionHeader title="Mother Documents" icon={<Heart className="size-5" />} color="text-rose-500" />

        <div className="w-full grid grid-cols-1 gap-x-3 gap-y-4 mb-6">
          {motherCards.map((props, idx) => (
            <RenderFamilyDocCard key={idx} {...props} />
          ))}
        </div>
      </section>

      {noFatherInfo ? null : (
        <section className="space-y-6">
          <SectionHeader title="Father Documents" icon={<User className="size-5" />} color="text-blue-600" />
          <div className="w-full grid grid-cols-1 gap-x-3 gap-y-4 mb-6">
            {fatherCards.map((props, idx) => (
              <RenderFamilyDocCard key={idx} {...props} />
            ))}
          </div>
        </section>
      )}
      {noGuardianInfo ? null : (
        <section className="space-y-6">
          <SectionHeader title="Guardian's Details" icon={<Users className="size-5" />} color="text-indigo-600" />
          <div className="w-full grid grid-cols-1 gap-x-3 gap-y-4">
            {guardianCards.map((props, idx) => (
              <RenderFamilyDocCard key={idx} {...props} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RenderFamilyDocCard({
  label,
  fileUrl,
  status,
  expiry,
  typeLabel,
}: {
  label: string;
  fileUrl?: string;
  status?: string;
  expiry?: string;
  typeLabel?: string;
}) {
  const isMissing = !fileUrl || status === "To follow";

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl gap-4 transition-all hover:border-slate-300">
      {/* Header Area: Icon & Text */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Icon Plate */}
        <div
          className={cn(
            "size-11 shrink-0 rounded-xl flex items-center justify-center transition-colors",
            isMissing ? "bg-slate-100 text-slate-400" : "bg-primary text-primary-foreground shadow-sm"
          )}>
          {isMissing ? <EyeClosed size={20} /> : <FileText size={20} />}
        </div>

        {/* Text Details */}
        <div className="flex flex-col min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{label}</h3>
            <StatusBadge status={status ? (status as StatusProps) : "Missing"} className="text-[10px] font-bold uppercase" />
          </div>

          <div className="flex flex-col gap-0.5">
            {expiry ? (
              <p className="text-[11px] text-slate-500 font-bold tracking-tight">
                Expires: {format(new Date(expiry), "dd MMM yyyy")}
              </p>
            ) : (
              <p
                className={cn(
                  "text-[11px] font-bold uppercase tracking-tighter",
                  isMissing ? "text-amber-600" : "text-slate-400"
                )}>
                {isMissing ? "Action Required" : "Record Verified"}
              </p>
            )}
            {typeLabel && (
              <span className="text-[10px] text-slate-400 font-medium truncate italic">Ref: {typeLabel}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 border-t border-slate-50 pt-3 sm:pt-0 sm:border-0 sm:ml-auto">
        {fileUrl ? (
          <Link
            to={fileUrl}
            target="_blank"
            className={buttonVariants({
              variant: "outline",
              className:
                "flex-1 sm:flex-none h-9 gap-2 text-[11px] !font-bold border-slate-200 hover:bg-slate-50 text-slate-600",
            })}>
            <Eye size={14} /> <span>View</span>
          </Link>
        ) : (
          <Button
            className="flex-1 sm:flex-none h-9 gap-2 text-[11px] !font-bold border-slate-200 hover:bg-slate-50 text-slate-600"
            disabled
            variant={"outline"}>
            <EyeClosed size={14} /> <span>View</span>
          </Button>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, icon, color }: { title: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3 pb-2">
      <div className={cn("p-2 bg-indigo-50 rounded-lg", color)}>{icon}</div>
      <h2 className="font-bold text-lg text-slate-800 tracking-tight">{title}</h2>
    </div>
  );
}

export default FamilyDocuments;
