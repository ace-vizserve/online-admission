import { getStudentDetails } from "@/actions/private";
import fileSvg from "@/assets/file.svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import StatusBadge, { StatusProps } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Document, StudentDetails, FamilyDocument } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import {
  EllipsisVertical,
  Eye,
  FolderOpen,
  Plus,
} from "lucide-react";
import { Link } from "react-router";

type ProfileProps = {
  studentID: string;
};

const tabs = [
  {
    name: "Student Documents",
    value: "student-documents",
    icon: FolderOpen,
  },
  {
    name: "Family Documents",
    value: "family-documents",
    icon: FolderOpen,
  },
];

function StudentFiles({ studentID }: ProfileProps) {
  const { data, isPending } = useQuery({
    queryKey: ["student-documents", studentID],
    queryFn: async () => {
      return await getStudentDetails({ studentID });
    },
  });

  if (isPending) {
    return (
      <div className="h-96 w-full flex flex-col gap-4 items-center justify-center my-7 md:my-14">
        <p className="text-sm text-muted-foreground animate-pulse">Fetching students details...</p>
        <Tailspin size="30" stroke="3" speed="0.9" color="#262E40" />
      </div>
    );
  }

  if (data == null) {
    return <NoData />;
  }

  const studentName = `${data.studentInformation[0].lastName}, ${data.studentInformation[0].firstName} ${
    data.studentInformation[0].middleName?.charAt(0) ?? ""
  }`;

  const studentNumber = data.studentInformation[0]?.studentNumber ?? "N/A";

  return (
    <Tabs
      defaultValue={tabs[0].value}
      orientation="vertical"
      className="w-full flex flex-col xl:flex-row items-start gap-4 justify-center py-4 lg:py-6">
      <TabsList className="w-full xl:w-[250px] flex flex-col gap-1 h-max !bg-white">
        <div className="w-full mt-4 mb-2 md:mb-4 lg:mb-8 space-y-4 px-4">
          <Avatar className="size-28 mx-auto border">
            <AvatarImage src={data.studentIDPicture.fileUrl ?? "https://github.com/shadcn.png"} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="text-center space-y-1">
            <p className="font-semibold text-black text-balance">{studentName}</p>
            <p className="text-sm text-muted-foreground font-semibold">Student # {studentNumber}</p>
          </div>
        </div>

        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="w-full p-3 md:p-4 data-[state=active]:bg-primary data-[state=active]:text-white">
            <tab.icon className="size-5" /> {tab.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent className="w-full px-2" key={tab.value} value={tab.value}>
          <InfoBox studentDetails={data} label={tab.name} value={tab.value} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function InfoBox({ label, value, studentDetails }: { label: string; value: string; studentDetails: StudentDetails }) {
  const { studentDocuments } = studentDetails;

  switch (value) {
    case "student-documents":
      return <StudentDocuments label={label} documents={studentDocuments} />;
    // case "family-information":
    //   return <FamilyInformation label={label} familyInformation={familyInformation} />;
    default:
      break;
  }
}

function StudentDocuments({ label, documents }: { label: string; documents: Document[] }) {
  const documentThatExpire = documents.filter((doc) => /(passport|pass)/i.test(doc.documentType));
  const documentsThatDoNotExpire = documents.filter((doc) => !/(passport|pass)/i.test(doc.documentType));

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
        {documentThatExpire.map((doc) => (
          <div
            key={doc.id}
            className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={doc.status as StatusProps} />
              {doc.documentType == "Pass" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="absolute right-0 -top-2" size={"icon"} variant={"outline"}>
                      <EllipsisVertical />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="grid gap-4">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">Student Pass</h4>
                        <p className="text-xs text-muted-foreground">See the details of the Student's Pass.</p>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="passType" className="text-xs">
                            Pass Type
                          </Label>
                          <Input
                            id="passType"
                            defaultValue={doc.passType!.replace("_", " ")}
                            className="col-span-2 h-8 capitalize"
                            readOnly
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="passExpirationDate" className="text-xs">
                            Expires at
                          </Label>
                          <Input
                            id="passExpirationDate"
                            defaultValue={formatDate(doc.passExpirationDate!, "PPP")}
                            className="col-span-2 h-8"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {doc.documentType == "Passport" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="absolute right-0 -top-2" size={"icon"} variant={"outline"}>
                      <EllipsisVertical />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="grid gap-4">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">Student Passport</h4>
                        <p className="text-xs text-muted-foreground">See the details of the Student's Passport.</p>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="passType" className="text-xs">
                            Passport #
                          </Label>
                          <Input
                            id="passType"
                            defaultValue={doc.passportNumber!}
                            className="col-span-2 h-8 uppercase"
                            readOnly
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="passExpirationDate" className="text-xs">
                            Expires at
                          </Label>
                          <Input
                            id="passExpirationDate"
                            defaultValue={formatDate(doc.passportExpirationDate!, "PPP")}
                            className="col-span-2 h-8"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">{doc.documentType}</p>

            <Link
              to={doc.fileUrl}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 text-xs  w-full",
                variant: "secondary",
              })}>
              View document <Eye />
            </Link>
          </div>
        ))}
      </div>

      <Separator />

      <h2 className="font-bold text-lg">Permanent Documents</h2>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-4">
        {documentsThatDoNotExpire.map((doc) => (
          <div
            key={doc.id}
            className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
              <StatusBadge className="absolute -top-2" status={doc.status as StatusProps} />
            </div>
            <p className="text-muted-foreground font-medium text-sm">{doc.documentType}</p>

            <Link
              to={doc.fileUrl}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 text-xs w-full",
                variant: "secondary",
              })}>
              View document <Eye />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function FamilyDocuments({label, documents}: { label: string: FamilyDocument[] }) {
  const documentThatExpire = documents.filter((doc) => /(passport|pass)/i.test(doc.documentType));

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
        {documentThatExpire.map((doc) => (
          <div
            key={doc.id}
            className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={doc.status as StatusProps} />
              {doc.documentType == "Pass" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="absolute right-0 -top-2" size={"icon"} variant={"outline"}>
                      <EllipsisVertical />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="grid gap-4">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">Student Pass</h4>
                        <p className="text-xs text-muted-foreground">See the details of the Student's Pass.</p>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="passType" className="text-xs">
                            Pass Type
                          </Label>
                          <Input
                            id="passType"
                            defaultValue={doc.passType!.replace("_", " ")}
                            className="col-span-2 h-8 capitalize"
                            readOnly
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="passExpirationDate" className="text-xs">
                            Expires at
                          </Label>
                          <Input
                            id="passExpirationDate"
                            defaultValue={formatDate(doc.passExpirationDate!, "PPP")}
                            className="col-span-2 h-8"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {doc.documentType == "Passport" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="absolute right-0 -top-2" size={"icon"} variant={"outline"}>
                      <EllipsisVertical />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="grid gap-4">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">Student Passport</h4>
                        <p className="text-xs text-muted-foreground">See the details of the Student's Passport.</p>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="passType" className="text-xs">
                            Passport #
                          </Label>
                          <Input
                            id="passType"
                            defaultValue={doc.passportNumber!}
                            className="col-span-2 h-8 uppercase"
                            readOnly
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="passExpirationDate" className="text-xs">
                            Expires at
                          </Label>
                          <Input
                            id="passExpirationDate"
                            defaultValue={formatDate(doc.passportExpirationDate!, "PPP")}
                            className="col-span-2 h-8"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">{doc.documentType}</p>

            <Link
              to={doc.fileUrl}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 text-xs  w-full",
                variant: "secondary",
              })}>
              View document <Eye />
            </Link>
          </div>
        ))}
      </div>

      <Separator />

      <h2 className="font-bold text-lg">Permanent Documents</h2>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-4">
        {documentsThatDoNotExpire.map((doc) => (
          <div
            key={doc.id}
            className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
              <StatusBadge className="absolute -top-2" status={doc.status as StatusProps} />
            </div>
            <p className="text-muted-foreground font-medium text-sm">{doc.documentType}</p>

            <Link
              to={doc.fileUrl}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 text-xs w-full",
                variant: "secondary",
              })}>
              View document <Eye />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoData() {
  return (
    <div className="w-full h-[80vh] flex items-center justify-center flex-col gap-4 text-center px-4">
      <div className="p-4 border bg-muted rounded-full">
        <FolderOpen className="size-12 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">No data to show here</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Looks like there's nothing yet. Once you add a student, they'll appear here.
        </p>
      </div>

      <Link
        to={"/enrol-student"}
        className={buttonVariants({
          variant: "outline",
          className: "mt-2 gap-2",
        })}>
        <Plus className="w-4 h-4 mr-2" />
        Add New Student
      </Link>
    </div>
  );
}


export default StudentFiles;
