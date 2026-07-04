import { DocumentRow, SectionHeader } from "@/components/private/documents/shared";
import { PARENT_GUARDIAN_DOCUMENTS } from "@/components/private/shared/upload-requirements/document-config";
import { FamilyDocument } from "@/types";
import { Heart, User, Users } from "lucide-react";
import { useParams, useSearchParams } from "react-router";

function parentGuardianDocConfig(name: string) {
  return PARENT_GUARDIAN_DOCUMENTS.find((cfg) => cfg.name === name)!;
}

function FamilyFiles({
  label,
  documents,
  noFatherInfo,
  noGuardianInfo,
}: {
  label: string;
  // `getFamilyDocuments` returns `{}` on its no-ownership/not-found paths, so callers can't rely on
  // every field being present.
  documents?: Partial<FamilyDocument>;
  noFatherInfo?: boolean;
  noGuardianInfo?: boolean;
}) {
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
    ["family-documents", enroleeNumber],
    ["student-profile", enroleeNumber],
  ];

  // Page-specific display titles, independent of `cfg.label` (used by the enrollment wizard) — see
  // `ReuploadDialog`'s note on why these stay separate instead of adopting the wizard's copy.
  const motherCards = [
    {
      name: "motherPassport",
      title: "Mother's Passport",
      fileUrl: documents?.motherPassport,
      status: documents?.motherPassportStatus,
      expiry: documents?.motherPassportExpiry,
      typeLabel: documents?.motherPassportNumber,
    },
    {
      name: "motherPass",
      title: "Mother's Pass",
      fileUrl: documents?.motherPass,
      status: documents?.motherPassStatus,
      expiry: documents?.motherPassExpiry,
      typeLabel: documents?.motherPassType,
    },
  ];

  const fatherCards = [
    {
      name: "fatherPassport",
      title: "Father's Passport",
      fileUrl: documents?.fatherPassport,
      status: documents?.fatherPassportStatus,
      expiry: documents?.fatherPassportExpiry,
      typeLabel: documents?.fatherPassportNumber,
    },
    {
      name: "fatherPass",
      title: "Father's Pass",
      fileUrl: documents?.fatherPass,
      status: documents?.fatherPassStatus,
      expiry: documents?.fatherPassExpiry,
      typeLabel: documents?.fatherPassType,
    },
  ];

  const guardianCards = [
    {
      name: "guardianPassport",
      title: "Guardian's Passport",
      fileUrl: documents?.guardianPassport,
      status: documents?.guardianPassportStatus,
      expiry: documents?.guardianPassportExpiry,
      typeLabel: documents?.guardianPassportNumber,
    },
    {
      name: "guardianPass",
      title: "Guardian's Pass",
      fileUrl: documents?.guardianPass,
      status: documents?.guardianPassStatus,
      expiry: documents?.guardianPassExpiry,
      typeLabel: documents?.guardianPassType,
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
          {motherCards.map((doc) => (
            <DocumentRow
              key={doc.name}
              cfg={parentGuardianDocConfig(doc.name)}
              title={doc.title}
              fileUrl={doc.fileUrl}
              status={doc.status}
              expiry={doc.expiry}
              typeLabel={doc.typeLabel}
              savedLabel="Record Verified"
              academicYear={academicYear}
              enroleeNumber={enroleeNumber}
              queryKeysToInvalidate={queryKeysToInvalidate}
              emailSection="Parent/Guardian Documents"
            />
          ))}
        </div>
      </section>

      {noFatherInfo ? null : (
        <section className="space-y-6">
          <SectionHeader title="Father Documents" icon={<User className="size-5" />} color="text-blue-600" />
          <div className="w-full grid grid-cols-1 gap-x-3 gap-y-4 mb-6">
            {fatherCards.map((doc) => (
              <DocumentRow
                key={doc.name}
                cfg={parentGuardianDocConfig(doc.name)}
                title={doc.title}
                fileUrl={doc.fileUrl}
                status={doc.status}
                expiry={doc.expiry}
                typeLabel={doc.typeLabel}
                savedLabel="Record Verified"
                academicYear={academicYear}
                enroleeNumber={enroleeNumber}
                queryKeysToInvalidate={queryKeysToInvalidate}
                emailSection="Parent/Guardian Documents"
              />
            ))}
          </div>
        </section>
      )}
      {noGuardianInfo ? null : (
        <section className="space-y-6">
          <SectionHeader title="Guardian's Details" icon={<Users className="size-5" />} color="text-indigo-600" />
          <div className="w-full grid grid-cols-1 gap-x-3 gap-y-4">
            {guardianCards.map((doc) => (
              <DocumentRow
                key={doc.name}
                cfg={parentGuardianDocConfig(doc.name)}
                title={doc.title}
                fileUrl={doc.fileUrl}
                status={doc.status}
                expiry={doc.expiry}
                typeLabel={doc.typeLabel}
                savedLabel="Record Verified"
                academicYear={academicYear}
                enroleeNumber={enroleeNumber}
                queryKeysToInvalidate={queryKeysToInvalidate}
                emailSection="Parent/Guardian Documents"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default FamilyFiles;
