import PageMetaData from "@/components/page-metadata";
import ParentFeedbackSurvey from "@/components/private/parent-survey-feedback";
import { Confetti } from "@/components/ui/confetti";
import { APPLICATION_SUBMITTED_PAGE_TITLE_DESCRIPTION } from "@/data";
import { useSubmissionState } from "@/hooks/use-submission-state";
import { motion } from "motion/react";
import { Navigate } from "react-router";

function RegistrationSubmitted() {
  const { title, description } = APPLICATION_SUBMITTED_PAGE_TITLE_DESCRIPTION;
  const submission = useSubmissionState();

  // Reached without a submission behind it (back/forward into an older success, a bookmark,
  // a hand-typed URL). Send them to the dashboard, where the real status of their
  // applications is listed, rather than congratulating them for something that may not have
  // happened.
  if (!submission) {
    return <Navigate to="/login" replace />;
  }

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

          <ParentFeedbackSurvey
            academicYear={submission.academicYear}
            enroleeNumber={submission.enroleeNumber}
          />
        </div>
      </div>
    </>
  );
}

export default RegistrationSubmitted;
