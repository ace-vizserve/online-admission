import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
import { cn } from "@/lib/utils";
import { useSelectAcademicYear } from "@/zustand-store";
import { NavLink, useParams } from "react-router";

function OldStudentSteps() {
  const { formState } = useEnrolOldStudentContext();
  const params = useParams();
  const academicYear = useSelectAcademicYear((state) => state.academicYear);

  const { familyInfo, enrollmentInfo, uploadRequirements } = formState;

  const isFamilyInfoInvalid = familyInfo == null;
  const enrollmentInfoIsInvalid = enrollmentInfo == null || enrollmentInfo.isValid !== true;
  const studentEnrolmentDocsIsInvalid = uploadRequirements?.studentUploadRequirements.isValid !== true;
  const parentGuardianEnrolmentDocsIsInvalid = uploadRequirements?.parentGuardianUploadRequirements.isValid !== true;

  return (
    <ol className="flex flex-col lg:flex-row gap-1 pb-6 lg:pb-0">
      <NavLink
        to={`/enrol-student/${params.id}/student-info?=academicYear=${academicYear}`}
        className={({ isActive }) =>
          buttonVariants({
            size: "lg",
            className: cn(
              "relative overflow-hidden lg:flex-1 w-full py-10 px-6 lg:rounded-t-none border lg:border-t-0 rounded-t-none border-t-0",
              {
                " bg-green-50 hover:bg-green-50 border-b-4 border-b-green-600 text-green-600 hover:text-green-600":
                  isActive,
              }
            ),
            variant: "outline",
          })
        }>
        <div className="space-y-1 text-center px-6 py-4">
          <p className="text-sm font-semibold">Student Information</p>
          <p className="text-xs text-muted-foreground">Review Student details</p>
        </div>
      </NavLink>

      <NavLink
        to={`/enrol-student/${params.id}/family-info?=academicYear=${academicYear}`}
        className={({ isActive }) =>
          buttonVariants({
            size: "lg",
            className: cn(
              "relative overflow-hidden lg:flex-1 w-full py-10 px-6 lg:rounded-t-none border lg:border-t-0",
              {
                " bg-green-50 hover:bg-green-50 border-b-4 border-b-green-600 text-green-600 hover:text-green-600":
                  isActive && !isFamilyInfoInvalid,
                "border-b-4 border-b-primary": isActive && isFamilyInfoInvalid,
              }
            ),
            variant: "outline",
          })
        }>
        {isFamilyInfoInvalid && <Badge className="text-[0.7rem] font-semibold absolute right-3 top-3">Review</Badge>}
        <div className="space-y-1 text-center px-6 py-4">
          <p className="text-sm font-semibold">Family Information</p>
          <p className="text-xs text-muted-foreground">Review Family information</p>
        </div>
      </NavLink>

      <NavLink
        to={`/enrol-student/${params.id}/enrollment-info?=academicYear=${academicYear}`}
        className={({ isActive }) =>
          buttonVariants({
            size: "lg",
            className: cn(
              "relative overflow-hidden lg:flex-1 w-full py-10 px-6 lg:rounded-t-none border lg:border-t-0",
              {
                " bg-green-50 hover:bg-green-50 border-b-4 border-b-green-600 text-green-600 hover:text-green-600":
                  isActive && !enrollmentInfoIsInvalid,
                "border-b-4 border-b-destructive": isActive && enrollmentInfoIsInvalid,
              }
            ),
            variant: "outline",
          })
        }>
        {enrollmentInfoIsInvalid && (
          <Badge className="text-[0.7rem] font-semibold absolute right-3 top-3" variant={"destructive"}>
            Unsaved
          </Badge>
        )}
        <div className="space-y-1 text-center px-6 py-4">
          <p className="text-sm font-semibold">Enrolment Information</p>
          <p className="text-xs text-muted-foreground">Review Student Enrolment details</p>
        </div>
      </NavLink>

      <NavLink
        to={`/enrol-student/${params.id}/documents?=academicYear=${academicYear}`}
        className={({ isActive }) =>
          buttonVariants({
            size: "lg",
            className: cn(
              "relative overflow-hidden lg:flex-1 w-full py-10 px-6 lg:rounded-t-none border lg:border-t-0",
              {
                "bg-green-50 hover:bg-green-50 border-b-4 border-b-green-600 text-green-600 hover:text-green-600":
                  isActive && !studentEnrolmentDocsIsInvalid && !parentGuardianEnrolmentDocsIsInvalid,

                "border-b-4 border-b-destructive":
                  isActive && (studentEnrolmentDocsIsInvalid || parentGuardianEnrolmentDocsIsInvalid),
              }
            ),
            variant: "outline",
          })
        }>
        {(studentEnrolmentDocsIsInvalid || parentGuardianEnrolmentDocsIsInvalid) && (
          <Badge className="text-[0.7rem] font-semibold absolute right-3 top-3" variant={"destructive"}>
            Unsaved
          </Badge>
        )}
        <div className="space-y-1 text-center px-6 py-4">
          <p className="text-sm font-semibold">Upload Requirements</p>
          <p className="text-xs text-muted-foreground">Review your documents</p>
        </div>
      </NavLink>
    </ol>
  );
}

export default OldStudentSteps;
