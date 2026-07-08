import MaxWidthWrapper from "@/components/max-width-wrapper";
import PageMetaData from "@/components/page-metadata";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar as PreCourseCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { toUTCDateOnly } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  useEnrolNewStudentStore,
  useEnrolOldStudentStore,
  usePreCourseAcknowledgementStore,
  useSelectAcademicYear,
} from "@/zustand-store";
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
import { useEffect, useState } from "react";
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
  const { enroleeType, isOpenHouseRegistration, isSTP = true } = state;

  useEffect(() => {
    if (!isOpenHouseRegistration) return;
    setPreCourseAnswer("Yes");
    setPreCourseDate(new Date());
  }, [isOpenHouseRegistration]);

  const canContinue = isSTP
    ? icaAcknowledged && feesAcknowledged && preCourseAnswer && (preCourseAnswer === "No" || !!preCourseDate)
    : preCourseAnswer && (preCourseAnswer === "No" || !!preCourseDate);

  const phone = "+65 8200 0062";

  function redirect() {
    if (enroleeType === "New" && isOpenHouseRegistration) {
      navigate("/open-house/account-info");
      return;
    }

    // Persist the pre-course answer/date into the flow's form state so it is
    // carried in the saved draft and restored on resume. The global session
    // store is volatile (sessionStorage, cleared on submit/new tab) which is
    // why resumed applications previously saved a null answer/date.
    const preCourseDetails = {
      preCourseAnswer: preCourseAnswer ?? undefined,
      preCourseDate,
    };

    if (enroleeType === "New") {
      useEnrolNewStudentStore.getState().setFormState(preCourseDetails);
      navigate(`/enrol-student/new/student-info?academicYear=${academicYear}`);
      return;
    } else {
      useEnrolOldStudentStore.getState().setFormState(preCourseDetails);
      navigate(`/enrol-student/${state.enroleeNumber}/student-info?academicYear=${academicYear}`);
      return;
    }
  }

  return (
    <>
      <PageMetaData
        title="Student Pass Guidelines | HFSE International School"
        description="Review the Student Pass application process and guidelines before proceeding with enrollment."
      />
      <div className="w-full sticky top-0 z-20 bg-background/80 h-20 md:h-24 flex items-center border-b border-border">
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
        <div className="rounded-2xl mb-16 text-center space-y-6 py-20 bg-gradient-to-br from-primary/5 to-accent border border-primary/20 shadow-sm relative overflow-hidden">
          {/* Content */}
          <div className="relative z-10 space-y-6 px-4 md:px-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-card border border-primary/20 shadow-sm">
              <div className="p-2 rounded-full bg-primary">
                <Handshake className="size-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-primary uppercase tracking-wide">Welcome, Parents!</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-primary">
                {isSTP ? "Student Pass Acknowledgement" : "Pre-Course Counselling Acknowledgement"}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
              {isSTP ? (
                <>
                  We're here to guide your family through Singapore's Student Pass process.
                  <span className="font-semibold text-foreground">
                    {" "}
                    Just review and check the boxes below—simple as that!
                  </span>
                </>
              ) : (
                <>
                  Before enrolment, please confirm your Pre-Course Counselling status.
                  <span className="font-semibold text-foreground"> Just answer the question below to continue.</span>
                </>
              )}
            </p>
          </div>
        </div>
        {/* SECTION HEADER */}
        {isSTP && (
          <div className="mt-24 text-center space-y-4">
            <Separator />
            <br />
            <br />
            <div className="w-max mx-auto px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-secondary/10 text-secondary border border-secondary/30 shadow-sm">
              Action Required
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-secondary">
              Please Review and Acknowledge the Information
            </h2>
            <p className="text-muted-foreground mx-auto max-w-lg text-base leading-relaxed">
              Kindly read each section carefully and tick the checkbox to confirm your understanding before continuing
              with the application.
            </p>
          </div>
        )}

        {/* Acknowledgement Cards */}
        <section className="mx-auto py-12">
          {isSTP && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Student's Pass Card */}
              <div className="p-8 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all space-y-6 hover:border-secondary/40">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="p-3 rounded-xl bg-secondary text-secondary-foreground">
                    <ShieldCheck className="size-5" />
                  </div>
                  <h3 className="text-xl tracking-tight font-bold text-secondary">Student's Pass Process</h3>
                </div>

                <p className="text-base font-medium text-secondary/90 leading-relaxed">
                  HFSE supports families with the{" "}
                  <strong className="text-secondary font-bold">Student's Pass application process</strong>, but{" "}
                  <strong className="text-secondary font-bold">
                    the Immigration & Checkpoints Authority (ICA) alone decides the outcome
                  </strong>
                  . The school cannot influence or guarantee approval.
                </p>

                <ul className="space-y-3 text-sm text-secondary/90">
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-0.5 font-bold">•</span>
                    <span>
                      Upload <strong>all required documents</strong> through the online enrolment portal so the school
                      can verify them. You will then submit your application directly to ICA via SOLAR+.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-0.5 font-bold">•</span>
                    <span>
                      ICA processing time is typically <strong>around 1–2 weeks</strong>, but{" "}
                      <strong>may be longer</strong> depending on case-by-case assessment and volume of applications.
                    </span>
                  </li>
                </ul>

                <div
                  className={cn(
                    "p-5 rounded-xl border transition-colors",
                    icaAcknowledged ? "bg-success/10 border-success/30" : "bg-muted/30 border-border",
                  )}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={icaAcknowledged}
                      onChange={() => setIcaAcknowledged(!icaAcknowledged)}
                      className="mt-1 size-5 accent-success cursor-pointer"
                    />
                    <span
                      className={cn(
                        "text-sm font-semibold transition-colors",
                        icaAcknowledged ? "text-success" : "text-foreground/80",
                      )}>
                      I understand that HFSE provides assistance, but ICA alone decides the Student's Pass approval and
                      the school cannot guarantee the outcome.
                    </span>
                  </label>
                </div>
              </div>

              {/* Fees Card */}
              <div className="p-8 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all space-y-6 hover:border-secondary/40">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-secondary text-secondary-foreground">
                    <ReceiptText className="size-5" />
                  </div>
                  <h3 className="text-xl tracking-tight font-bold text-secondary">ICA Fees & School Refunds</h3>
                </div>

                <p className="text-base text-secondary/90 leading-relaxed">
                  <strong className="text-secondary font-bold">
                    ICA Student's Pass processing and issuance fees are non-refundable
                  </strong>{" "}
                  regardless of the outcome of the application or any withdrawal.
                </p>

                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-destructive/10 text-sm">
                    <p className="font-bold text-destructive mb-1">ICA Application Fees</p>
                    <p className="text-muted-foreground">
                      Government fees paid to ICA for <strong>Student's Pass processing and issuance</strong> are{" "}
                      <strong>non-refundable in all cases</strong>.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/10 text-sm">
                    <p className="font-bold text-secondary mb-1">School Tuition Fees</p>
                    <p className="text-muted-foreground">
                      Refunds for <strong>school tuition fees</strong> follow the{" "}
                      <strong>Refund Policy in the Standard PEI-Student Contract</strong>.
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "p-5 rounded-xl border transition-colors",
                    feesAcknowledged ? "bg-success/10 border-success/30" : "bg-muted/30 border-border",
                  )}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feesAcknowledged}
                      onChange={() => setFeesAcknowledged(!feesAcknowledged)}
                      className="mt-1 size-5 accent-success cursor-pointer"
                    />
                    <span
                      className={cn(
                        "text-sm font-semibold transition-colors",
                        feesAcknowledged ? "text-success" : "text-foreground/80",
                      )}>
                      I understand that ICA Student's Pass fees are non-refundable and that school tuition fee refunds
                      follow the Student Contract.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 2. Pre-Course Counselling Section */}
          <div className="mt-8 rounded-2xl bg-card border border-secondary/20 p-8 space-y-6 shadow-sm">
            {!isOpenHouseRegistration && (
              <>
                <div className="flex items-center gap-3">
                  <Handshake className="size-6 text-secondary" />
                  <h2 className="text-xl font-bold text-secondary">Pre-Course Counselling Acknowledgement</h2>
                </div>

                <p className="text-sm text-secondary/90 font-medium leading-relaxed">
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
                      className="size-5 accent-success"
                    />
                    <span
                      className={cn("text-sm font-medium text-muted-foreground hover:text-foreground", {
                        "text-foreground font-semibold": preCourseAnswer === "Yes",
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
                      className="size-5 accent-success"
                    />
                    <span
                      className={cn("text-sm font-medium text-muted-foreground hover:text-foreground", {
                        "text-foreground font-semibold": preCourseAnswer === "No",
                      })}>
                      No, I have not completed Pre-Course Counselling yet.
                    </span>
                  </label>
                </div>

                {preCourseAnswer === "Yes" && (
                  <div className="pt-4 border-t border-border flex flex-wrap items-center gap-6 animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm font-semibold text-destructive">
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
                            setPreCourseDate(d ? toUTCDateOnly(d) : d);
                            setOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                {preCourseAnswer === "No" && (
                  <div className="flex flex-col gap-3 p-5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6" />
                      <h3 className="text-sm font-semibold">Important Notice</h3>
                    </div>
                    <p className="font-medium text-sm leading-relaxed">
                      Our Admissions Officer will reach out to schedule a{" "}
                      <strong>Pre‑Course Counselling session</strong>. You can continue with the online enrolment now,
                      but the counselling must be completed and acknowledged before your child begins the course.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="text-center space-y-6 pt-8">
              <Button
                onClick={redirect}
                variant="cta"
                size="lg"
                disabled={!canContinue}
                className="px-8 py-6 text-xs md:text-sm uppercase tracking-widest gap-4">
                Proceed to Application
                <ArrowUpRight className="size-4 stroke-3" />
              </Button>

              <p
                className={cn(
                  "text-sm font-bold transition-all uppercase italic",
                  !canContinue ? "text-secondary" : "text-success",
                )}>
                {!canContinue
                  ? "Please complete all acknowledgements above before continuing"
                  : "All acknowledgements are completed. You may proceed to the application form"}
              </p>

              <div className="flex items-center justify-center gap-2 text-foreground">
                <Clock className="size-4" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Est. Time to Complete: 15–20 Minutes
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* --- Help Footer --- */}
        <div className="flex flex-col md:flex-row items-center justify-between p-8 rounded-xl bg-muted/30 border border-border gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="size-12 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
              <HelpCircle className="size-6 text-muted-foreground/70" />
            </div>
            <div>
              <h4 className="text-base font-bold text-primary">Unsure about a specific document?</h4>
              <p className="text-sm font-medium text-muted-foreground">
                Our admissions team can review your scans before submission.
              </p>
            </div>
          </div>

          <Button asChild variant="default" size="lg" className="text-xs md:text-sm uppercase tracking-widest gap-4">
            <a href={`tel:${phone}`}>
              <PhoneCall /> Contact Admissions
            </a>
          </Button>
        </div>
      </MaxWidthWrapper>
    </>
  );
}

export default STPGuidelines;
