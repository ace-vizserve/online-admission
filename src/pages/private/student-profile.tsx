import PageMetaData from "@/components/page-metadata";
import Profile from "@/components/private/student-profile/profile";
import { Button } from "@/components/ui/button";
import { STUDENT_PROFILE_TITLE_DESCRIPTION } from "@/data";
import { Edit } from "lucide-react";
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
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
        <Button className="w-max ml-auto gap-2">
          <Edit /> Edit Information
        </Button>
        <Profile studentID={params.id} />
      </div>
    </>
  );
}

export default StudentProfile;
