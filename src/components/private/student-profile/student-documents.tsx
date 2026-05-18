import { Button, buttonVariants } from "@/components/ui/button";
import StatusBadge, { StatusProps } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { StudentDocument } from "@/types";
import { format } from "date-fns";
import { Eye, EyeClosed, FileText } from "lucide-react";
import { Link } from "react-router";

function StudentDocuments({ label, documents }: { label: string; documents: StudentDocument }) {
  const studentPassApplicationDocs = documents.studentPassApplicationDocuments
    ? [
        { title: "ICA Photo", type: "icaPhoto", data: documents.studentPassApplicationDocuments[0] },
        {
          title: "Vaccination Information",
          type: "vaccinationInformation",
          data: documents.studentPassApplicationDocuments[1],
        },
        {
          title: "Financial Support Documents",
          type: "financialSupportDocs",
          data: documents.studentPassApplicationDocuments[2],
        },
      ]
    : null;

  const expiringDocs = [
    { title: "Student Pass", type: "pass", data: documents.documentsThatExpire[1] },
    { title: "Passport", type: "passport", data: documents.documentsThatExpire[0] },
  ];

  const permanentDocs = [
    { title: "ID Picture", type: "idPicture", data: documents.permanentDocuments[0] },
    { title: "Medical Exam", type: "medical", data: documents.permanentDocuments[1] },
    { title: "Birth Certificate", type: "birthCert", data: documents.permanentDocuments[2] },
    { title: "Transcript of Records", type: "educCert", data: documents.permanentDocuments[3] },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Simple Header */}
      <div className="space-y-1">
        <h1 className="font-black text-2xl md:text-4xl text-slate-900 tracking-tight">{label}</h1>
        <p className="text-sm font-medium text-slate-500">
          This section includes details about the student's documents for this current school year.
        </p>
      </div>

      {studentPassApplicationDocs != null && (
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            Student Pass Application Documents
          </h2>
          <div className="grid gap-3">
            {studentPassApplicationDocs.map((doc) => (
              <DocumentRow key={doc.type} title={doc.title} doc={doc.data} type={doc.type} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Documents that expire</h2>
        <div className="grid gap-3">
          {expiringDocs.map((doc) => (
            <DocumentRow key={doc.type} title={doc.title} doc={doc.data} type={doc.type} />
          ))}
        </div>
      </div>

      {/* Section: Permanent */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Permanent documents</h2>
        <div className="grid gap-3">
          {permanentDocs.map((doc) => (
            <DocumentRow key={doc.type} title={doc.title} doc={doc.data} type={doc.type} />
          ))}
        </div>
      </div>
    </div>
  );
}

type DocRecord = Record<string, string | Date | null | undefined>;

function DocumentRow({ title, doc, type }: { title: string; doc: DocRecord | null | undefined; type: string }) {
  const isMissing = !doc || Object.values(doc).every((v) => v == null) || doc?.[`${type}Status`] === "To follow";
  const status = (doc?.[`${type}Status`] || "Missing") as StatusProps;

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl gap-4 transition-all hover:border-slate-300">
      {/* Header Area: Icon & Text */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Icon Plate */}
        <div
          className={cn(
            "size-11 shrink-0 rounded-xl flex items-center justify-center transition-colors",
            isMissing ? "bg-slate-100 text-slate-400" : "bg-primary text-primary-foreground shadow-sm",
          )}>
          {isMissing ? <EyeClosed size={20} /> : <FileText size={20} />}
        </div>

        {/* Text Details */}
        <div className="flex flex-col min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{title}</h3>
            <StatusBadge status={status} className="text-[10px] font-bold uppercase" />
          </div>

          {!isMissing && doc?.[`${type}Expiry`] ? (
            <p className="text-[11px] text-slate-500 font-bold tracking-tight">
              Expires: {format(new Date(doc[`${type}Expiry`] as string), "dd MMM yyyy")}
            </p>
          ) : (
            <p
              className={cn(
                "text-[11px] font-bold uppercase tracking-tighter",
                isMissing ? "text-amber-600" : "text-slate-500",
              )}>
              {isMissing ? "Action Required" : "Record saved"}
            </p>
          )}
        </div>
      </div>

      {/* Action Area: Full-width on mobile, auto-width on desktop */}
      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 border-t border-slate-50 pt-3 sm:pt-0 sm:border-0 sm:ml-auto">
        {!isMissing && doc?.[type] ? (
          <Link
            to={doc[type] as string}
            target="_blank"
            className={buttonVariants({
              variant: "outline",
              className: "flex-1 sm:flex-none h-9 gap-2 text-[11px] font-bold border-slate-200 hover:bg-slate-50",
            })}>
            <Eye size={14} />
            <span>View</span>
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

export default StudentDocuments;
