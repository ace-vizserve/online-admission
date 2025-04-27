import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NavLink, useParams } from "react-router";

function OldStudentSteps() {
  const params = useParams();

  return (
    <ol className="flex flex-col-reverse lg:flex-row gap-0.5 pb-6 lg:pb-0">
      <NavLink
        to={`/enrol-student/${params.id}/student-info`}
        className={({ isActive }) =>
          buttonVariants({
            size: "lg",
            className: cn("relative overflow-hidden lg:flex-1 w-full py-10 px-6 rounded-none", {
              " bg-green-50 hover:bg-green-50 border-b-4 border-b-green-600 text-green-600 hover:text-green-600":
                isActive,
            }),
            variant: "outline",
          })
        }>
        <div className="space-y-1 text-center px-6 py-4">
          <p className="text-sm font-semibold">Student Information</p>
          <p className="text-xs text-muted-foreground">Student details</p>
        </div>
      </NavLink>

      <NavLink
        to={`/enrol-student/${params.id}/family-info`}
        className={({ isActive }) =>
          buttonVariants({
            size: "lg",
            className: cn("relative overflow-hidden lg:flex-1 w-full py-10 px-6 rounded-none", {
              " bg-green-50 hover:bg-green-50 border-b-4 border-b-green-600 text-green-600 hover:text-green-600":
                isActive,
            }),
            variant: "outline",
          })
        }>
        <div className="space-y-1 text-center px-6 py-4">
          <p className="text-sm font-semibold">Family Information</p>
          <p className="text-xs text-muted-foreground">Family & guardian</p>
        </div>
      </NavLink>

      <NavLink
        to={`/enrol-student/${params.id}/enrollment-info`}
        className={({ isActive }) =>
          buttonVariants({
            size: "lg",
            className: cn("relative overflow-hidden lg:flex-1 w-full py-10 px-6 rounded-none", {
              " bg-green-50 hover:bg-green-50 border-b-4 border-b-green-600 text-green-600 hover:text-green-600":
                isActive,
            }),
            variant: "outline",
          })
        }>
        <div className="space-y-1 text-center px-6 py-4">
          <p className="text-sm font-semibold">Enrollment Information</p>
          <p className="text-xs text-muted-foreground">Student Enrollment Details</p>
        </div>
      </NavLink>

      <NavLink
        to={`/enrol-student/${params.id}/documents`}
        className={({ isActive }) =>
          buttonVariants({
            size: "lg",
            className: cn("relative overflow-hidden lg:flex-1 w-full py-10 px-6 rounded-none", {
              "bg-green-50 hover:bg-green-50 border-b-4 border-b-green-600 text-green-600 hover:text-green-600":
                isActive,
            }),
            variant: "outline",
          })
        }>
        <div className="space-y-1 text-center px-6 py-4">
          <p className="text-sm font-semibold">Your Documents</p>
          <p className="text-xs text-muted-foreground">Check your documents</p>
        </div>
      </NavLink>
    </ol>
  );
}

export default OldStudentSteps;
