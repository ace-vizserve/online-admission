import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

function ApplicationSubmitted() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <div className="flex flex-col items-center gap-2">
        <div className="relative animate-bounce">
          <img src="/like.png" className="size-40 object-cover" />
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

        <h1 className="text-2xl lg:text-3xl font-bold">We’ve received your application!</h1>

        <p className="text-sm lg:text-base text-muted-foreground">We will process it and reach out to you in a days.</p>

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
  );
}

export default ApplicationSubmitted;
