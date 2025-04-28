import EnrolOldStudentContextProvider from "@/context/enrol-old-student-context";
import { ArrowLeft } from "lucide-react";
import { Link, Outlet } from "react-router";
import MaxWidthWrapper from "../max-width-wrapper";
import OldStudentSteps from "../private/enrol-student/old-student-steps";
import SubmitApplicationDialog from "../private/enrol-student/submit-application-dialog";
import { buttonVariants } from "../ui/button";

function OldStudentLayout() {
  return (
    <EnrolOldStudentContextProvider>
      <div className="sticky top-0 w-full z-20 bg-white/70 backdrop-blur-lg h-20 flex items-center border-b">
        <MaxWidthWrapper className="w-full max-w-screen-2xl flex items-center justify-between ">
          <Link
            to={"/admission/dashboard"}
            className={buttonVariants({
              variant: "link",
              className: "gap-2",
            })}>
            <ArrowLeft /> Go back
          </Link>
          <SubmitApplicationDialog />
        </MaxWidthWrapper>
      </div>

      <MaxWidthWrapper className="max-w-screen-2xl bg-grainy">
        <div className="min-h-screen max-w-screen-2xl mx-auto flex flex-col md:gap-12 items-center justify-center">
          <div className="order-last lg:order-first w-full overflow-x-auto">
            <OldStudentSteps />
          </div>
          <Outlet />
        </div>
      </MaxWidthWrapper>
    </EnrolOldStudentContextProvider>
  );
}

export default OldStudentLayout;
