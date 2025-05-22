import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import StatusBadge, { StatusProps } from "@/components/ui/status-badge";
import { Eye, EyeClosed, EllipsisVertical } from "lucide-react";
import { Link } from "react-router";
import fileSvg from "@/assets/file.svg";
import { FamilyDocument } from "@/types";
import { formatDate } from "date-fns";

function renderFamilyDocCard({
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
  const isMissing = !fileUrl;
  return (
    <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
      <div className="w-full flex relative">
        <StatusBadge className="absolute -top-2" status={status as StatusProps || "Missing"} />
        {!isMissing && (
          <Popover>
            <PopoverTrigger asChild>
              <Button className="absolute right-0 -top-2" size={"icon"} variant={"outline"}>
                <EllipsisVertical />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <div className="grid gap-4">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{label}</h4>
                  <p className="text-xs text-muted-foreground">See the details of the {label}.</p>
                </div>
                <div className="grid gap-2">
                  {typeLabel && (
                    <div className="grid grid-cols-3 items-center gap-4">
                      <span className="text-xs">Type</span>
                      <Input
                        defaultValue={typeLabel}
                        className="col-span-2 h-8 capitalize"
                        readOnly
                      />
                    </div>
                  )}
                  {expiry && (
                    <div className="grid grid-cols-3 items-center gap-4">
                      <span className="text-xs">Expires at</span>
                      <Input
                        defaultValue={formatDate(new Date(expiry), "PPP")}
                        className="col-span-2 h-8"
                        readOnly
                      />
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
        <div className="pt-4 w-max mx-auto">
          <img src={fileSvg} className="size-10" />
        </div>
      </div>
      <p className="text-muted-foreground font-medium text-sm">{label}</p>
      {isMissing ? (
        <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
          View document <EyeClosed />
        </Button>
      ) : (
        <Link
          to={fileUrl}
          target="_blank"
          className={buttonVariants({
            className: "gap-2 text-xs  w-full",
            variant: "secondary",
          })}>
          View document <Eye />
        </Link>
      )}
    </div>
  );
}

function FamilyFiles({ label, documents }: { label: string; documents?: FamilyDocument }) {
  if (!documents || Object.keys(documents).length === 0) {
    return (
      <div className="space-y-8 py-6 xl:py-0">
        <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
        <p className="text-sm text-muted-foreground">No family documents found.</p>
      </div>
    );
  }

  const docCards = [
    {
      label: "Mother's Passport",
      fileUrl: documents.motherPassport ?? undefined,
      status: documents.motherPassportStatus ?? undefined,
      expiry: documents.motherPassportExpiry ?? undefined,
      typeLabel: documents.motherPassportNumber ?? undefined,
    },
    {
      label: "Mother's Pass",
      fileUrl: documents.motherPass ?? undefined,
      status: documents.motherPassStatus ?? undefined,
      expiry: documents.motherPassExpiry ?? undefined,
      typeLabel: documents.motherPassType ?? undefined,
    },
    {
      label: "Father's Passport",
      fileUrl: documents.fatherPassport ?? undefined,
      status: documents.fatherPassportStatus ?? undefined,
      expiry: documents.fatherPassportExpiry ?? undefined,
      typeLabel: documents.fatherPassportNumber ?? undefined,
    },
    {
      label: "Father's Pass",
      fileUrl: documents.fatherPass ?? undefined,
      status: documents.fatherPassStatus ?? undefined,
      expiry: documents.fatherPassExpiry ?? undefined,
      typeLabel: documents.fatherPassType ?? undefined,
    },
    {
      label: "Guardian's Passport",
      fileUrl: documents.guardianPassport ?? undefined,
      status: documents.guardianPassportStatus ?? undefined,
      expiry: documents.guardianPassportExpiry ?? undefined,
      typeLabel: documents.guardianPassportNumber ?? undefined,
    },
    {
      label: "Guardian's Pass",
      fileUrl: documents.guardianPass ?? undefined,
      status: documents.guardianPassStatus ?? undefined,
      expiry: documents.guardianPassExpiry ?? undefined,
      typeLabel: documents.guardianPassType ?? undefined,
    },
  ];

  return (
    <div className="space-y-8 py-6 xl:py-0">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          This section includes details about the parent and guardian documents for this current school year.
        </p>
      </div>
      <h2 className="font-bold text-lg">Family Documents</h2>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-4">
        {docCards.map((props) => renderFamilyDocCard(props))}
      </div>
    </div>
  );
}

export default FamilyFiles;
