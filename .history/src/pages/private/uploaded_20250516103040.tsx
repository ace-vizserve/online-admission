import StudentFiles from "@/components/private/documents/student-files";
import Profile from "@/components/private/student-profile/profile";
import { useParams } from "react-router";

function Uploaded() {
  const params = useParams();

  if (!params.id) {
    return <h1>Student number is not defined!</h1>;
  }

  return (
    <>
      <div className="py-7 md:py-14 px-4 md:px-6">
        <StudentFiles studentID={params.id} />
      </div>
    </>
  );
}

export default Uploaded;
