import EnrolOldStudentContextProvider from "@/context/enrol-old-student-context";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, Outlet } from "react-router";
import MaxWidthWrapper from "../max-width-wrapper";
import OldStudentSteps from "../private/enrol-student/old-student-steps";
import { Button, buttonVariants } from "../ui/button";

function OldStudentLayout() {
  return (
    <EnrolOldStudentContextProvider>
      <div className="sticky top-0 w-full z-20 bg-white/70 backdrop-blur-lg h-20 flex items-center justify-between border-b px-6 md:px-8">
        <Link
          to={"/admission/dashboard"}
          className={buttonVariants({
            variant: "link",
            className: "gap-2",
          })}>
          <ArrowLeft /> Go back
        </Link>
        <Button className="gap-2" size={"lg"}>
          Submit Application <ArrowRight />
        </Button>
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
