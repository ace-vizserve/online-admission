import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar as PreCourseCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { usePreCourseAcknowledgementStore, useSelectAcademicYear } from "@/zustand-store";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  ChevronDownIcon,
  Clock,
  Handshake,
  HelpCircle,
  PhoneCall,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function STPGuidelines() {
  const [icaAcknowledged, setIcaAcknowledged] = useState<boolean>(false);
  const [feesAcknowledged, setFeesAcknowledged] = useState<boolean>(false);

  const preCourseAnswer = usePreCourseAcknowledgementStore((state) => state.preCourseAnswer);
  const setPreCourseAnswer = usePreCourseAcknowledgementStore((state) => state.setPreCourseAnswer);
  const preCourseDate = usePreCourseAcknowledgementStore((state) => state.preCourseDate);
  const setPreCourseDate = usePreCourseAcknowledgementStore((state) => state.setPreCourseDate);
  const [open, setOpen] = useState(false);

  const { academicYear } = useSelectAcademicYear();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { enroleeType } = state;

  const canContinue =
    icaAcknowledged && feesAcknowledged && preCourseAnswer && (preCourseAnswer === "No" || !!preCourseDate);

  const phone = "+65 8200 0062";

  function redirect() {
    if (enroleeType === "New") {
      navigate(`/enrol-student/new/student-info?academicYear=${academicYear}`);
      return;
    } else {
      navigate(`/enrol-student/${state.enroleeNumber}/student-info?academicYear=${academicYear}`);
      return;
    }
  }

  return (
    <>
      <div className="w-full sticky top-0 z-20 bg-white/70 backdrop-blur-lg h-20 md:h-24 flex items-center border-b">
        <MaxWidthWrapper className="w-full max-w-screen-2xl px-4 md:px-6">
          <Link
            onClick={() => history.back()}
            to={"/admission/dashboard"}
            className={buttonVariants({
              variant: "link",
              className: "gap-2 !font-bold",
            })}>
            <ArrowLeft /> Go back
          </Link>
        </MaxWidthWrapper>
      </div>
      <MaxWidthWrapper className="animate-in fade-in slide-in-from-bottom-2 lg:px-0 duration-500 mt-16 mb-24 relative w-full min-h-screen">
        <div className="rounded-2xl mb-16 text-center space-y-6 py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 shadow-xl relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-full blur-3xl"></div>

          {/* Content */}
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/90 backdrop-blur-sm border-2 border-blue-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <Handshake className="size-4 text-white" />
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-wide">
                Welcome, Parents!
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-6xl font-black tracking-tight">
              <span className="text-primary">Student Pass Acknowledgement</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-4">
              We're here to guide your family through Singapore's Student Pass process.
              <span className="font-semibold text-slate-700">
                {" "}
                Just review and check the boxes below—simple as that!
              </span>
            </p>
          </div>
        </div>
        {/* SECTION HEADER */}
        <div className="mt-24 text-center space-y-4">
          <Separator />
          <br />
          <br />
          <div className="w-max mx-auto px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border border-amber-300 shadow-md shadow-amber-100/50">
            Action Required
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-amber-700">
            Please Review and Acknowledge the Information
          </h2>
          <p className="text-slate-600 mx-auto max-w-lg text-base leading-relaxed">
            Kindly read each section carefully and tick the checkbox to confirm your understanding before continuing
            with the application.
          </p>
        </div>

        {/* Acknowledgement Cards */}
        <section className="mx-auto py-12">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Student's Pass Card */}
            <div className="group p-8 rounded-xl border border-slate-200 bg-white shadow-md hover:shadow-xl transition-all duration-300 space-y-6 hover:border-amber-700/30">
              <div className="flex flex-wrap items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-700 text-white group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="size-5" />
                </div>
                <h3 className="text-xl tracking-tight font-black text-amber-700">Student's Pass Process</h3>
              </div>

              <p className="text-base font-medium text-amber-700 leading-relaxed">
                HFSE supports families with the{" "}
                <strong className="text-amber-900 font-bold">Student's Pass application process</strong>, but{" "}
                <strong className="text-amber-900 font-bold">
                  the Immigration & Checkpoints Authority (ICA) alone decides the outcome
                </strong>
                . The school cannot influence or guarantee approval.
              </p>

              <ul className="space-y-3 text-sm text-amber-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-900 mt-0.5 font-bold">•</span>
                  <span>
                    Submit <strong>all required documents</strong> through the online enrolment portal so the school can
                    verify and prepare your ICA submission.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-900 mt-0.5 font-bold">•</span>
                  <span>
                    ICA processing time is typically <strong>around 1–2 weeks</strong>, but{" "}
                    <strong>may be longer</strong> depending on case-by-case assessment and volume of applications.
                  </span>
                </li>
              </ul>

              <div
                className={cn(
                  "p-5 rounded-xl border transition-all duration-300",
                  icaAcknowledged ? "bg-green-50 border-green-200 shadow-sm" : "bg-slate-50 border-slate-200",
                )}>
                <label className="flex items-start gap-3 cursor-pointer group/checkbox">
                  <input
                    type="checkbox"
                    checked={icaAcknowledged}
                    onChange={() => setIcaAcknowledged(!icaAcknowledged)}
                    className="mt-1 size-5 accent-green-700 cursor-pointer"
                  />
                  <span
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      icaAcknowledged ? "text-green-800" : "text-slate-700",
                    )}>
                    I understand that HFSE provides assistance, but ICA alone decides the Student's Pass approval and
                    the school cannot guarantee the outcome.
                  </span>
                </label>
              </div>
            </div>

            {/* Fees Card */}
            <div className="group p-8 rounded-xl border border-slate-200 bg-white shadow-md hover:shadow-xl transition-all duration-300 space-y-6 hover:border-amber-700/30">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-700 text-white group-hover:scale-110 transition-transform duration-300">
                  <ReceiptText className="size-5" />
                </div>
                <h3 className="text-xl tracking-tight font-black text-amber-700">ICA Fees & School Refunds</h3>
              </div>

              <p className="text-base text-amber-700 leading-relaxed">
                <strong className="text-amber-900 font-bold">
                  ICA Student's Pass processing and issuance fees are non-refundable
                </strong>{" "}
                regardless of the outcome of the application or any withdrawal.
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-red-50 text-sm">
                  <p className="font-bold text-red-600 mb-1">ICA Application Fees</p>
                  <p className="text-slate-600">
                    Government fees paid to ICA for <strong>Student's Pass processing and issuance</strong> are{" "}
                    <strong>non-refundable in all cases</strong>.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 text-sm">
                  <p className="font-bold text-amber-700 mb-1">School Tuition Fees</p>
                  <p className="text-slate-600">
                    Refunds for <strong>school tuition fees</strong> follow the{" "}
                    <strong>Refund Policy in the Standard PEI-Student Contract</strong>.
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "p-5 rounded-xl border transition-all duration-300",
                  feesAcknowledged ? "bg-green-50 border-green-200 shadow-sm" : "bg-slate-50 border-slate-200",
                )}>
                <label className="flex items-start gap-3 cursor-pointer group/checkbox">
                  <input
                    type="checkbox"
                    checked={feesAcknowledged}
                    onChange={() => setFeesAcknowledged(!feesAcknowledged)}
                    className="mt-1 size-5 accent-green-700 cursor-pointer"
                  />
                  <span
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      feesAcknowledged ? "text-green-800" : "text-slate-700",
                    )}>
                    I understand that ICA Student's Pass fees are non-refundable and that school tuition fee refunds
                    follow the Student Contract.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* 2. Pre-Course Counselling Section */}
          <div className="mt-8 rounded-2xl bg-white border border-amber-200 p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Handshake className="size-6 text-amber-700" />
              <h2 className="text-xl font-bold text-amber-700">Pre-Course Counselling Acknowledgement</h2>
            </div>

            <p className="text-sm text-amber-700 font-medium leading-relaxed">
              Before enrolment, HFSE provides <strong>Pre-Course Counselling</strong> on course information, fees,
              refund policy, Student's Pass procedures, and key regulations. Please confirm whether you have already
              completed and signed the Pre-Course Counselling Acknowledgement Form.
            </p>

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="preCourseSigned"
                  value="Yes"
                  checked={preCourseAnswer === "Yes"}
                  onChange={() => setPreCourseAnswer("Yes")}
                  className="size-5 accent-green-700"
                />
                <span
                  className={cn("text-sm font-medium text-slate-600 hover:text-slate-900", {
                    "text-slate-900 font-semibold": preCourseAnswer === "Yes",
                  })}>
                  Yes, I have completed Pre-Course Counselling and signed the acknowledgement form.
                </span>
              </label>

              <label className="flex gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="preCourseSigned"
                  value="No"
                  checked={preCourseAnswer === "No"}
                  onChange={() => {
                    setPreCourseAnswer("No");
                    setPreCourseDate(undefined);
                  }}
                  className="size-5 accent-green-700"
                />
                <span
                  className={cn("text-sm font-medium text-slate-600 hover:text-slate-900", {
                    "text-slate-900 font-semibold": preCourseAnswer === "No",
                  })}>
                  No, I have not completed Pre-Course Counselling yet.
                </span>
              </label>
            </div>

            {preCourseAnswer === "Yes" && (
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 animate-in fade-in slide-in-from-top-2">
                <p className="text-sm font-semibold text-red-600">
                  *Select the date you signed the Pre-Course Counselling Acknowledgement
                </p>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full md:w-48 justify-between">
                      {preCourseDate ? preCourseDate.toLocaleDateString("en-SG") : "Pick a date"}
                      <ChevronDownIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <PreCourseCalendar
                      className={"w-full"}
                      mode="single"
                      disabled={{
                        after: new Date(),
                      }}
                      selected={preCourseDate}
                      onSelect={(d) => {
                        setPreCourseDate(d);
                        setOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {preCourseAnswer === "No" && (
              <div className="flex flex-col gap-3 p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="text-sm font-semibold">Important Notice</h3>
                </div>
                <p className="font-medium text-sm leading-relaxed">
                  Our Admissions Officer will reach out to schedule a <strong>Pre‑Course Counselling session</strong>.
                  You can continue with the online enrolment now, but the counselling must be completed and acknowledged
                  before your child begins the course.
                </p>
              </div>
            )}

            <div className="text-center space-y-6 pt-8">
              <Button
                onClick={redirect}
                size="lg"
                disabled={!canContinue}
                className="!px-8 !py-8 rounded-xl text-white text-xs md:text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 gap-4">
                Proceed to Application
                <ArrowUpRight className="size-4 stroke-3" />
              </Button>

              <p
                className={cn(
                  "text-sm font-bold transition-all uppercase italic",
                  !canContinue ? " text-amber-600" : "text-emerald-600",
                )}>
                {!canContinue
                  ? "Please complete all acknowledgements above before continuing"
                  : "All acknowledgements are completed. You may proceed to the application form"}
              </p>

              <div className="flex items-center justify-center gap-2 text-slate-900">
                <Clock className="size-4" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Est. Time to Complete: 15–20 Minutes
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* --- Help Footer --- */}
        <div className="flex flex-col md:flex-row items-center justify-between p-8 rounded-xl bg-slate-50 border border-slate-200 gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="size-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <HelpCircle className="size-6 text-slate-400" />
            </div>
            <div>
              <h4 className="text-base font-black text-primary">Unsure about a specific document?</h4>
              <p className="text-sm font-medium text-slate-500">
                Our admissions team can review your scans before submission.
              </p>
            </div>
          </div>

          <a href={`tel:${phone}`}>
            <Button className="!px-8 !py-8 rounded-2xl bg-blue-600 text-white text-xs md:text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 gap-4">
              <PhoneCall /> Contact Admissions
            </Button>
          </a>
        </div>
      </MaxWidthWrapper>
    </>
  );
}

export default STPGuidelines;
