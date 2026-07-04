import { DocumentRow } from "@/components/private/documents/shared";
import { STUDENT_DOCUMENTS } from "@/components/private/shared/upload-requirements/document-config";
import { StudentDocument } from "@/types";
import { useParams, useSearchParams } from "react-router";

function studentDocConfig(name: string) {
  return STUDENT_DOCUMENTS.find((cfg) => cfg.name === name)!;
}

function StudentFiles({ label, documents }: { label: string; documents: StudentDocument }) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const academicYear = searchParams.get("academicYear");

  // Every downstream action builds table names as `${academicYear}_enrolment_...` — without this
  // guard, a missing `?academicYear=` query param would silently query `null_enrolment_...` tables
  // and every reupload/read would fail opaquely instead of with a clear message.
  if (!academicYear) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-6 text-center">
        <p className="text-sm font-bold text-amber-700">Missing academic year</p>
        <p className="text-xs text-amber-600 mt-1">
          This page needs an academic year to load documents. Please return to the dashboard and try again.
        </p>
      </div>
    );
  }

  const enroleeNumber = params.id!;
  const queryKeysToInvalidate = [
    ["student-documents", enroleeNumber],
    ["student-profile", enroleeNumber],
  ];

  const [passportDoc, passDoc] = documents.documentsThatExpire;
  const [idPictureDoc, medicalDoc, birthCertDoc, educCertDoc] = documents.permanentDocuments;

  // Page-specific display titles, independent of `cfg.label` (used by the enrollment wizard) — see
  // `ReuploadDialog`'s note on why these stay separate instead of adopting the wizard's copy.
  const expiringDocs = [
    { name: "pass", title: "Student Pass", fileUrl: passDoc.pass, status: passDoc.passStatus, expiry: passDoc.passExpiry },
    {
      name: "passport",
      title: "Passport",
      fileUrl: passportDoc.passport,
      status: passportDoc.passportStatus,
      expiry: passportDoc.passportExpiry,
    },
  ];

  const permanentDocs = [
    { name: "idPicture", title: "ID Picture", fileUrl: idPictureDoc.idPicture, status: idPictureDoc.idPictureStatus },
    { name: "medical", title: "Medical Exam", fileUrl: medicalDoc.medical, status: medicalDoc.medicalStatus },
    { name: "birthCert", title: "Birth Certificate", fileUrl: birthCertDoc.birthCert, status: birthCertDoc.birthCertStatus },
    { name: "educCert", title: "Transcript of Records", fileUrl: educCertDoc.educCert, status: educCertDoc.educCertStatus },
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

      {/* Section: Expiring */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Documents that expire</h2>
        <div className="grid gap-3">
          {expiringDocs.map((doc) => (
            <DocumentRow
              key={doc.name}
              cfg={studentDocConfig(doc.name)}
              title={doc.title}
              fileUrl={doc.fileUrl}
              status={doc.status}
              expiry={doc.expiry ? String(doc.expiry) : null}
              academicYear={academicYear}
              enroleeNumber={enroleeNumber}
              queryKeysToInvalidate={queryKeysToInvalidate}
              emailSection="Student Documents"
            />
          ))}
        </div>
      </div>

      {/* Section: Permanent */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Permanent documents</h2>
        <div className="grid gap-3">
          {permanentDocs.map((doc) => (
            <DocumentRow
              key={doc.name}
              cfg={studentDocConfig(doc.name)}
              title={doc.title}
              fileUrl={doc.fileUrl}
              status={doc.status}
              academicYear={academicYear}
              enroleeNumber={enroleeNumber}
              queryKeysToInvalidate={queryKeysToInvalidate}
              emailSection="Student Documents"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudentFiles;
