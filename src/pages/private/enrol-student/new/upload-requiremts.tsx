import PageMetaData from "@/components/page-metadata";
import ParentGuardianUpload from "@/components/private/enrol-student/steps/upload-requirements/parent-guardian-upload";
import StudentUpload from "@/components/private/enrol-student/steps/upload-requirements/student-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { ENROL_NEW_STUDENT_UPLOAD_REQUIREMENTS_TITLE_DESCRIPTION } from "@/data";
import { Navigate } from "react-router";

function UploadRequirements() {
  const { title, description } = ENROL_NEW_STUDENT_UPLOAD_REQUIREMENTS_TITLE_DESCRIPTION;
  const { formState } = useEnrolNewStudentContext();

  if (formState.enrollmentInfo == null) {
    return <Navigate to={"/enrol-student/new/enrollment-info"} />;
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="w-full flex-1">
        <div className="space-y-8 max-w-7xl mx-auto">
          <Card className="w-full mx-auto shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-primary">Upload Student Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StudentUpload />
            </CardContent>
          </Card>
          <Separator />
          <Card className="w-full mx-auto border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-primary">Parent/Guardian Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ParentGuardianUpload />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default UploadRequirements;
