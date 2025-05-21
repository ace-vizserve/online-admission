import PageMetaData from "@/components/page-metadata";
import Profile from "@/components/private/student-profile/profile";
import { STUDENT_PROFILE_TITLE_DESCRIPTION } from "@/data";
import { useParams } from "react-router";

function StudentProfile() {
  const { title, description } = STUDENT_PROFILE_TITLE_DESCRIPTION;
  const params = useParams();

  if (!params.id) {
    return <h1>Student number is not defined!</h1>;
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="py-7 md:py-14 px-4 md:px-6">
        <Profile enroleeNumber={params.id} />
      </div>
    </>
  );
}

export default StudentProfile;
