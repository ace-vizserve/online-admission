import Profile from "@/components/private/student-profile/profile";
import { Button } from "@/components/ui/button";
import { UserPlus2 } from "lucide-react";
import { useParams } from "react-router";

function StudentProfile() {
  const params = useParams();

  if (!params.id) {
    return <h1>Student number is not defined!</h1>;
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
      <Button className="w-max ml-auto gap-2">
        <UserPlus2 /> Enroll a new student
      </Button>
      <Profile studentID={params.id} />
    </div>
  );
}

export default StudentProfile;
