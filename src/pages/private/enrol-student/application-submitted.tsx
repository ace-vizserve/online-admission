import PageMetaData from "@/components/page-metadata";
import { buttonVariants } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { APPLICATION_SUBMITTED_PAGE_TITLE_DESCRIPTION } from "@/data";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

function ApplicationSubmitted() {
  const { title, description } = APPLICATION_SUBMITTED_PAGE_TITLE_DESCRIPTION;

  return (
    <>
      <PageMetaData title={title} description={description} />

      <Confetti className="absolute inset-0 w-full h-dvh" />

      <div className="min-h-dvh flex flex-col items-center justify-center text-center p-4">
        <div className="flex flex-col items-center gap-2">
          <div className="relative animate-bounce">
            <img src="/like.png" className="size-32 md:size-40 object-cover" />
            <div className="absolute top-4 flex gap-2 -rotate-45">
              <div className="w-1 h-4 bg-yellow-400 rounded-full" />
              <div className="w-1 h-4 bg-yellow-400 rounded-full" />
              <div className="w-1 h-4 bg-yellow-400 rounded-full" />
            </div>

            <div className="absolute top-4 right-0 flex gap-2 rotate-45">
              <div className="w-1 h-4 bg-yellow-400 rounded-full" />
              <div className="w-1 h-4 bg-yellow-400 rounded-full" />
              <div className="w-1 h-4 bg-yellow-400 rounded-full" />
            </div>
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold">Your application has been received!</h1>

          <p className="text-sm lg:text-base text-muted-foreground">
            We’re reviewing it and will get in touch with you within a few days.
          </p>

          <Link
            to={"/admission/dashboard"}
            className={buttonVariants({
              className: "mt-4 gap-2",
              size: "lg",
            })}>
            <ArrowLeft /> Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}

export default ApplicationSubmitted;
