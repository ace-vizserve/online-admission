import EnrolNewStudentContextProvider from "@/context/enrol-new-student-context";
import { ArrowLeft } from "lucide-react";
import { Link, Outlet } from "react-router";
import MaxWidthWrapper from "../max-width-wrapper";
import Steps from "../private/enrol-student/new-student-steps";
import { buttonVariants } from "../ui/button";

function NewStudentLayout() {
  return (
    <>
      <div className="sticky top-0 w-full z-20 bg-white/70 backdrop-blur-lg h-20 flex items-center border-b px-6 md:px-8">
        <Link
          to={"/admission/dashboard"}
          className={buttonVariants({
            variant: "link",
            className: "gap-2",
          })}>
          <ArrowLeft /> Back to Dashboard
        </Link>
      </div>
      <EnrolNewStudentContextProvider>
        <MaxWidthWrapper className="max-w-screen-2xl bg-grainy">
          <div className="min-h-screen max-w-screen-2xl mx-auto flex flex-col md:gap-12 items-center justify-center">
            <div className="order-last lg:order-first w-full overflow-x-auto">
              <Steps />
            </div>
            <Outlet />
          </div>
        </MaxWidthWrapper>
      </EnrolNewStudentContextProvider>
    </>
  );
}

export default NewStudentLayout;
