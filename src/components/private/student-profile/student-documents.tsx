import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import StatusBadge, { StatusProps } from "@/components/ui/status-badge";
import { StudentDocument } from "@/types";
import { Label } from "@radix-ui/react-dropdown-menu";
import { formatDate } from "date-fns";
import { EllipsisVertical, Eye, EyeClosed } from "lucide-react";
import { Link } from "react-router";

import fileSvg from "@/assets/file.svg";

function StudentDocuments({ label, documents }: { label: string; documents: StudentDocument }) {
  const passportDocument = documents.documentsThatExpire[0];
  const passDocument = documents.documentsThatExpire[1];

  const form12Document = documents.permanentDocuments[0];
  const medicalCertDocument = documents.permanentDocuments[1];
  const birthCertDocument = documents.permanentDocuments[2];
  const eduCertDocument = documents.permanentDocuments[3];

  return (
    <div className="space-y-8 py-6 xl:py-0">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          This section includes details about the student's documents for this current school year.
        </p>
      </div>

      <h2 className="font-bold text-lg">Documents That Expire</h2>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-4">
        {Object.values(passDocument).some((v) => v == null) ? (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={"Missing"} />

              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Pass</p>

            <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
              View document <EyeClosed />
            </Button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={passDocument.passStatus as StatusProps} />
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="absolute right-0 -top-2" size={"icon"} variant={"outline"}>
                    <EllipsisVertical />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <div className="grid gap-4">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Student Pass</h4>
                      <p className="text-xs text-muted-foreground">See the details of the Student's Pass.</p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-xs">Pass Type</Label>
                        <Input
                          id="passType"
                          defaultValue={passDocument.passType!.replace("_", " ")}
                          className="col-span-2 h-8 capitalize"
                          tabIndex={-1}
                          readOnly
                        />
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-xs">Expires at</Label>
                        <Input
                          id="passExpirationDate"
                          defaultValue={formatDate(new Date(passDocument.passExpiry!), "PPP")}
                          className="col-span-2 h-8"
                          tabIndex={-1}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Pass</p>

            <Link
              to={passDocument.pass!}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 text-xs  w-full",
                variant: "secondary",
              })}>
              View document <Eye />
            </Link>
          </div>
        )}

        {Object.values(passportDocument).some((v) => v == null) ? (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={"Missing"} />

              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Passport</p>

            <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
              View document <EyeClosed />
            </Button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={passportDocument.passportStatus as StatusProps} />
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="absolute right-0 -top-2" size={"icon"} variant={"outline"}>
                    <EllipsisVertical />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <div className="grid gap-4">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Student Passport</h4>
                      <p className="text-xs text-muted-foreground">See the details of the Student's Passport.</p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-xs">Passport #</Label>
                        <Input
                          id="passType"
                          defaultValue={passportDocument.passportNumber!}
                          tabIndex={-1}
                          className="col-span-2 h-8 capitalize"
                          readOnly
                        />
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-xs">Expires at</Label>
                        <Input
                          id="passExpirationDate"
                          defaultValue={formatDate(new Date(passportDocument.passportExpiry!), "PPP")}
                          className="col-span-2 h-8"
                          tabIndex={-1}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Passport</p>

            <Link
              to={passportDocument.passport!}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 text-xs  w-full",
                variant: "secondary",
              })}>
              View document <Eye />
            </Link>
          </div>
        )}
      </div>

      <Separator />

      <h2 className="font-bold text-lg">Permanent Documents</h2>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-4">
        {Object.values(form12Document).some((v) => v == null) ? (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={"Missing"} />

              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Form 12</p>

            <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
              View document <EyeClosed />
            </Button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={form12Document.form12Status as StatusProps} />

              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Form 12</p>

            <Link
              to={form12Document.form12!}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 text-xs  w-full",
                variant: "secondary",
              })}>
              View document <Eye />
            </Link>
          </div>
        )}

        {Object.values(medicalCertDocument).some((v) => v == null) ? (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={"Missing"} />

              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Medical Exam</p>

            <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
              View document <EyeClosed />
            </Button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={medicalCertDocument.medicalStatus as StatusProps} />

              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Medical Exam</p>

            <Link
              to={medicalCertDocument.medical!}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 text-xs  w-full",
                variant: "secondary",
              })}>
              View document <Eye />
            </Link>
          </div>
        )}

        {Object.values(birthCertDocument).some((v) => v == null) ? (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={"Missing"} />

              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Birth Certificate</p>

            <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
              View document <EyeClosed />
            </Button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={birthCertDocument.birthCertStatus as StatusProps} />

              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Birth Certificate</p>

            <Link
              to={birthCertDocument.birthCert!}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 text-xs  w-full",
                variant: "secondary",
              })}>
              View document <Eye />
            </Link>
          </div>
        )}

        {Object.values(eduCertDocument).some((v) => v == null) ? (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={"Missing"} />

              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Transcript of Records</p>

            <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
              View document <EyeClosed />
            </Button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={eduCertDocument.educCertStatus as StatusProps} />

              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Transcript of Records</p>

            <Link
              to={eduCertDocument.educCert!}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 text-xs  w-full",
                variant: "secondary",
              })}>
              View document <Eye />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDocuments;
