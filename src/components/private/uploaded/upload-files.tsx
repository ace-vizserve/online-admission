import { useParams } from "react-router";
import StudentFiles from "@/components/private/documents/student-files";

const UploadFiles = () => {
  const params = useParams();
  const studentID = params.id;

  if (!studentID) {
    return <h1>Student number is not defined!</h1>;
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
      <StudentFiles studentID={studentID} />
    </div>
  );
};

export default UploadFiles;