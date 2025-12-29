import PageMetaData from "@/components/page-metadata";
import { buttonVariants } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { APPLICATION_SUBMITTED_PAGE_TITLE_DESCRIPTION } from "@/data";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

function ApplicationSubmitted() {
  const { title, description } = APPLICATION_SUBMITTED_PAGE_TITLE_DESCRIPTION;

  return (
    <>
      <PageMetaData title={title} description={description} />

      <Confetti className="absolute inset-0 w-full h-dvh pointer-events-none" />

      <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-to-b from-white to-blue-50/50">
        <div className="max-w-2xl w-full flex flex-col items-center gap-8">
          {/* Animated Illustration Header */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="relative">
              <img
                src="/like.png"
                className="size-32 md:size-40 object-cover animate-bounce"
                style={{ animationDuration: "3s" }}
              />
              {/* Your existing decorative rays */}
              <div className="absolute top-4 -left-4 flex gap-2 -rotate-45">
                <div className="w-1 h-4 bg-yellow-400 rounded-full" />
                <div className="w-1 h-4 bg-yellow-400 rounded-full" />
              </div>
              <div className="absolute top-4 -right-4 flex gap-2 rotate-45">
                <div className="w-1 h-4 bg-yellow-400 rounded-full" />
                <div className="w-1 h-4 bg-yellow-400 rounded-full" />
              </div>
            </motion.div>

            <div className="text-center space-y-2 mt-4">
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900">Application Received!</h1>
              <p className="text-slate-500 max-w-md font-medium mx-auto leading-relaxed">
                Thank you for choosing HFSE. Your journey toward a brighter future starts here.
              </p>
            </div>
          </div>

          <Link
            to={"/admission/dashboard"}
            className={buttonVariants({
              className: "!px-10 !py-6 !rounded-xl gap-2 !font-bold !shadow-lg !shadow-primary/20",
              size: "lg",
            })}>
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}

export default ApplicationSubmitted;
