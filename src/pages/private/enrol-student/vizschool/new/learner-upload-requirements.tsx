import ErrorPage from "@/components/error-page";
import PageMetaData from "@/components/page-metadata";
import ParentGuardianUpload from "@/components/private/enrol-student/vizschool/steps/upload-requirements/parent-guardian-upload";
import LearnerUpload from "@/components/private/enrol-student/vizschool/steps/upload-requirements/student-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEnrolNewLearnerContext } from "@/context/vizschool/enrol-new-learner-context";
import { ENROL_NEW_STUDENT_UPLOAD_REQUIREMENTS_TITLE_DESCRIPTION } from "@/data";
import { ErrorBoundary } from "react-error-boundary";
import { firstIncompleteStepUrl } from "@/lib/step-validity";
import { Navigate } from "react-router";

function LearnerUploadRequirements() {
  const { title, description } = ENROL_NEW_STUDENT_UPLOAD_REQUIREMENTS_TITLE_DESCRIPTION;
  const { formState } = useEnrolNewLearnerContext();

  // Sends the parent to the earliest step whose data is incomplete, so a step is never
  // rendered on top of unmet prerequisites. Validity-based: the old presence check was
  // satisfied by a slice the autosave wrote on the first keystroke.
  const incompleteStepUrl = firstIncompleteStepUrl(formState, "viz-school", "uploadRequirements");

  if (incompleteStepUrl != null) {
    return <Navigate to={incompleteStepUrl} replace />;
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-8 max-w-7xl mx-auto">
          <ErrorBoundary fallback={<ErrorPage />}>
            <Card className="w-full mx-auto shadow-none border-none">
              <CardHeader>
                <CardTitle className="text-2xl font-black tracking-tight text-secondary text-center">
                  Upload Student Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <LearnerUpload />
              </CardContent>
            </Card>
            <Separator />
            <Card className="w-full mx-auto border-none shadow-none">
              <CardHeader>
                <CardTitle className="text-2xl font-black tracking-tight text-secondary text-center">
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

export default LearnerUploadRequirements;
