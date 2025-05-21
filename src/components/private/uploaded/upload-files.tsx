import StudentFiles from "@/components/private/documents/student-files";
import { useParams } from "react-router";

const UploadFiles = () => {
  const params = useParams();
  const enroleeNumber = params.id;

  if (!enroleeNumber) {
    return <h1>Student number is not defined!</h1>;
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
      <StudentFiles enroleeNumber={enroleeNumber} />
    </div>
  );
};

export default UploadFiles;
