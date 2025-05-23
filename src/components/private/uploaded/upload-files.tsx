import { getStudentDetails, getFamilyDocuments } from "@/actions/private";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentDocumentsList } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { FolderOpen, Plus, User } from "lucide-react";
import { Link } from "react-router";
import StudentDocuments from "@/components/private/documents/student-files";
import FamilyDocuments from "@/components/private/documents/family-files";
import SingleDocuments from "../documents/single-documents";

type ProfileProps = {
  enroleeNumber: string;
};

const tabs = [
  {
    name: "Student Information",
    value: "student-information",
    icon: User,
  },
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

function UploadFiles({ enroleeNumber }: ProfileProps) {
  const { data, isPending } = useQuery({
    queryKey: ["student-documents", enroleeNumber],
    queryFn: async () => {
      return await getStudentDetails({ enroleeNumber });
    },
  });

  const { data: familyDocuments, isLoading: isFamilyLoading } = useQuery({
    queryKey: ["family-documents", enroleeNumber],
    queryFn: () => {
      if (!enroleeNumber) return {};
      return getFamilyDocuments(enroleeNumber);
    },
    enabled: !!enroleeNumber,
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

  const studentName = `${data.studentInformation.lastName}, ${data.studentInformation.firstName} ${
    data.studentInformation.middleName?.charAt(0) ?? ""
  }`;

  const studentNumber = data.studentInformation?.studentNumber ?? "N/A";

  return (
    <Tabs
      defaultValue={tabs[0].value}
      orientation="vertical"
      className="w-full flex flex-col xl:flex-row items-start gap-4 justify-center py-4 lg:py-6">
      <TabsList className="w-full xl:w-[250px] flex flex-col gap-1 h-max !bg-white">
        <div className="w-full mt-4 mb-2 md:mb-4 lg:mb-8 space-y-4 px-4">
          <Avatar className="size-28 mx-auto border">
            <AvatarImage className="object-cover" src={data.studentIDPicture ?? "https://github.com/shadcn.png"} />
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
          <InfoBox
            studentDetails={data as unknown as StudentDocumentsList}
            label={tab.name}
            value={tab.value}
            familyDocuments={familyDocuments}
            isFamilyLoading={isFamilyLoading}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InfoBox({ label, value, studentDetails, familyDocuments }: { label: string; value: string; studentDetails: StudentDocumentsList; familyDocuments?: any; isFamilyLoading?: boolean }) {
  const { studentDocuments, studentInformation } = studentDetails;
  switch (value) {
    case "student-information":
      return <SingleDocuments label={label} studentInformation={studentInformation} />;
    case "student-documents":
      return <StudentDocuments label={label} documents={studentDocuments} />;
    case "family-documents": {
      return <FamilyDocuments label={label} documents={familyDocuments} />;
    }
    default:
      return null;
  }
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

export default UploadFiles;
