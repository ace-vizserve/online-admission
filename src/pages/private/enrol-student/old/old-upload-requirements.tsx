import ErrorPage from "@/components/error-page";
import PageMetaData from "@/components/page-metadata";
import ParentGuardianUpload from "@/components/private/enrol-student/tabs/upload-requirements/parent-guardian-upload";
import StudentUpload from "@/components/private/enrol-student/tabs/upload-requirements/student-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ENROL_NEW_STUDENT_UPLOAD_REQUIREMENTS_TITLE_DESCRIPTION } from "@/data";
import { ErrorBoundary } from "react-error-boundary";

function OldUploadRequirements() {
  const { title, description } = ENROL_NEW_STUDENT_UPLOAD_REQUIREMENTS_TITLE_DESCRIPTION;

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-8 max-w-7xl mx-auto">
          <ErrorBoundary fallback={<ErrorPage />}>
            <Card className="w-full mx-auto shadow-none border-none">
              <CardHeader>
                <CardTitle className="text-2xl font-black tracking-tight text-primary text-center">
                  Upload Student Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <StudentUpload />
              </CardContent>
            </Card>
            <Separator />
            <Card className="w-full mx-auto border-none shadow-none">
              <CardHeader>
                <CardTitle className="text-2xl font-black tracking-tight text-primary text-center">
                  Parent/Guardian Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ParentGuardianUpload />
              </CardContent>
            </Card>
          </ErrorBoundary>
        </div>
      </div>
    </>
  );
}

export default OldUploadRequirements;
