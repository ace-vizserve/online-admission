import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar as PreCourseCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { usePassTypeStore, usePreCourseAcknowledgementStore, useSelectAcademicYear } from "@/zustand-store";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronDownIcon,
  ClipboardCheck,
  Clock,
  Compass,
  CreditCard,
  ExternalLink,
  FileBadge,
  FileCheck,
  FileText,
  GraduationCap,
  Handshake,
  HelpCircle,
  Info,
  LogOut,
  PhoneCall,
  ReceiptText,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Syringe,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

function STPGuidelines() {
  const [icaAcknowledged, setIcaAcknowledged] = useState<boolean>(false);
  const [feesAcknowledged, setFeesAcknowledged] = useState<boolean>(false);

  const preCourseAnswer = usePreCourseAcknowledgementStore((state) => state.preCourseAnswer);
  const setPreCourseAnswer = usePreCourseAcknowledgementStore((state) => state.setPreCourseAnswer);
  const preCourseDate = usePreCourseAcknowledgementStore((state) => state.preCourseDate);
  const setPreCourseDate = usePreCourseAcknowledgementStore((state) => state.setPreCourseDate);
  const [open, setOpen] = useState(false);

  const { stpApplicationType } = usePassTypeStore();
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

  const getDefaultTab = () => {
    if (stpApplicationType === "New Student Pass Application") {
      return "new";
    } else if (stpApplicationType === "New STP Application (Current HFSE Student)") {
      return "renewal";
    } else if (stpApplicationType === "Student Pass Transfer Application") {
      return "transfer";
    }
    return "new"; // Fallback
  };

  return (
    <>
      <ScrollDownButton />
      <div className="w-full sticky top-0 z-20 bg-white/70 backdrop-blur-lg h-16 md:h-20 flex items-center border-b">
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
      <MaxWidthWrapper className="mt-16 mb-24 relative w-full min-h-screen">
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

            <h1 className="text-4xl md:text-6xl font-black tracking-tight">
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

        <section className="space-y-12 px-4">
          {/* --- Pill Header --- */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 shadow-sm">
              <FileText className="size-3 text-blue-600" />
              <span className="text-xs font-black uppercase tracking-widest text-blue-600">Documentation Portal</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-primary max-w-4xl text-balance">
              Required Documents for {stpApplicationType}
            </h2>
            <p className="text-slate-500 max-w-lg text-base font-medium leading-relaxed">
              Tailored requirements based on your specific application path.
            </p>
          </div>

          <Tabs defaultValue={getDefaultTab()} className="w-full">
            {/* --- Glassmorphic Pill Track --- */}

            {/* --- NEW APPLICATION --- */}
            <TabsContent value="new" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-8 rounded-xl bg-white border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Compass className="size-6" />
                    </div>
                    <h4 className="text-xl font-black text-primary">Travel Documents</h4>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Valid passport (6+ months validity)",
                      "Passport photo page & entry stamp",
                      "CDA Vaccination verification match",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-base font-medium text-slate-500">
                        <div className="size-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="size-3 text-emerald-600" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-8 rounded-xl bg-white border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <GraduationCap className="size-6" />
                    </div>
                    <h4 className="text-xl font-black text-primary">School Records</h4>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Letter of Offer from HFSE",
                      "Verified previous school transcripts",
                      "Completed Entrance Test results",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-base font-medium text-slate-500">
                        <div className="size-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="size-3 text-emerald-600" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-2 p-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 bg-white/10 rounded-full blur-3xl" />
                  <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    <div className="size-16 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                      <Syringe className="size-8 text-white" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <h4 className="text-2xl font-black tracking-tight">Medical & Vaccination (Age ≤ 12)</h4>
                      <p className="text-blue-100 text-base font-medium">
                        Mandatory submission to National Immunisation Registry (NIR).
                      </p>
                      <div className="grid md:grid-cols-2 gap-3">
                        {[
                          "DTP (Diphtheria, Tetanus)",
                          "Measles & BCG",
                          "Medical Exam Report",
                          "NIR Registration Form",
                        ].map((med) => (
                          <div
                            key={med}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                            <CheckCircle2 className="size-4 text-blue-200" />
                            <span className="text-sm font-bold uppercase tracking-tight">{med}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* --- RENEWAL --- */}
            <TabsContent value="renewal" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-8 rounded-xl bg-white border border-slate-100 shadow-sm group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CreditCard className="size-6" />
                    </div>
                    <h4 className="text-xl font-black text-primary">Current ID</h4>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Current Student Pass (Front & Back)",
                      "Updated Residential Address",
                      "Valid Passport (Min 6 months)",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-base font-medium text-slate-500">
                        <div className="size-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="size-3 text-emerald-600" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-8 rounded-xl bg-white border border-slate-100 shadow-sm group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <ClipboardCheck className="size-6" />
                    </div>
                    <h4 className="text-xl font-black text-primary">Performance</h4>
                  </div>
                  <ul className="space-y-4">
                    {["Recent Academic Transcripts", "Attendance Record (Min 90%)", "Proof of Re-enrollment"].map(
                      (item) => (
                        <li key={item} className="flex items-start gap-3 text-base font-medium text-slate-500">
                          <div className="size-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="size-3 text-emerald-600" />
                          </div>
                          {item}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* --- TRANSFER --- */}
            <TabsContent value="transfer" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-6">
                <div className="p-8 rounded-xl bg-amber-50 border border-amber-100 flex flex-col md:flex-row gap-8 items-center">
                  <div className="size-20 rounded-3xl bg-white shadow-xl shadow-amber-200/50 flex items-center justify-center shrink-0">
                    <LogOut className="size-10 text-amber-600" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-primary tracking-tight">Withdrawal Clearance</h4>
                    <p className="text-base font-medium text-slate-500 leading-relaxed">
                      Before applying through HFSE, you must provide a <strong>Clearance Letter</strong> or Proof of
                      Withdrawal from your current Private Education Institution (PEI).
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-8 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <h4 className="text-base font-black text-slate-400 uppercase tracking-widest mb-6">
                      Essential Proof
                    </h4>
                    <div className="space-y-4">
                      {["Official PEI Release Form", "Current Pass Status", "HFSE Enrollment Contract"].map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <FileBadge className="size-5 text-amber-600" />
                          <span className="text-sm font-bold text-slate-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 rounded-xl shadow-xl relative overflow-hidden bg-white border border-amber-100">
                    <AlertCircle className="size-8 text-amber-600 mb-4" />
                    <h4 className="text-lg font-black mb-2 text-primary">
                      Important notice for Student’s Pass transfers
                    </h4>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                      Transfers are only possible if your child currently holds a valid Student’s Pass at the time of
                      the transfer application. If there is a long gap after the pass has expired (for example, more
                      than a few months), ICA may require a fresh application to be submitted as a{" "}
                      <span className="font-semibold text-slate-800">“New Student’s Pass”</span> instead of a transfer.
                    </p>
                    <p className="mt-3 text-sm font-medium leading-relaxed">
                      Our Admissions team will review your child’s current pass status and advise whether the case
                      should proceed as a transfer, renewal, or new Student’s Pass application under ICA guidelines.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-12 p-8 rounded-xl bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group">
            {/* Decorative subtle background icon */}
            <Camera className="absolute -right-4 -bottom-4 size-32 text-slate-50 opacity-[0.03] -rotate-12 pointer-events-none" />

            <div className="flex flex-col lg:flex-row gap-10 relative z-10">
              {/* Left Column: Header */}
              <div className="lg:w-1/3 space-y-4">
                <div className="size-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100/50">
                  <Camera className="size-7" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1">
                    Specification
                  </h4>
                  <h3 className="text-xl font-bold text-primary tracking-tight">ICA Photo Guidelines</h3>
                </div>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  Submissions that fail these specs will be automatically flagged by ICA's facial recognition system,
                  causing significant delays.
                </p>
              </div>

              {/* Right Column: Grid Checklist */}
              <div className="lg:w-2/3">
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { title: "Recency", desc: "Taken within the last 3 months" },
                    { title: "Background", desc: "Plain white, no shadows/patterns" },
                    { title: "Expression", desc: "Neutral, eyes open, front-facing" },
                    { title: "Headgear", desc: "None, except religious/medical" },
                    { title: "Eyewear", desc: "Clear lenses, no glare or tint" },
                    { title: "Quality", desc: "High resolution, sharp focus" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 py-3 border-b border-slate-100 group/item">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{item.title}</p>
                        <p className="text-[13px] font-semibold text-slate-700 leading-tight">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 w-full py-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <p className="font-bold text-xs text-slate-500">
                For full ICA photo specifications, please refer to the official guidelines.
              </p>
              <a
                href="https://www.ica.gov.sg/photo-guidelines"
                target="_blank"
                rel="noreferrer"
                className="font-bold flex gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline">
                View ICA Photo Guidelines <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </section>

        <section className="space-y-12 mt-20 px-4">
          {/* --- Pill Header --- */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100">
              <div className="size-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-rose-600">Health Compliance</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">Vaccination Requirements</h2>
            <p className="text-slate-500 max-w-lg text-base leading-relaxed">
              For foreign-born children aged <span className="text-primary font-semibold">12 years and below</span>,
              documentation of diphtheria and measles vaccination (or proof of immunity) is required as part of the
              long-term pass / Student’s Pass process in Singapore.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* --- Mandatory Section --- */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative p-8 rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                <div className="absolute top-6 right-6">
                  <span className="bg-rose-600 text-white px-3 py-1 rounded-full font-bold text-sm uppercase tracking-tighter">
                    Required by MOH
                  </span>
                </div>

                <h3 className="text-xl font-bold text-primary mb-8 flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <ShieldCheck className="size-6" />
                  </div>
                  Core vaccinations for Student’s Pass
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Diphtheria Card */}
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-rose-200 transition-colors">
                    <h4 className="font-bold text-base text-primary mb-4 uppercase tracking-wide">1. Diphtheria</h4>
                    <ul className="space-y-3">
                      {[
                        "Part of the primary DTP/DTaP series",
                        "Full primary course should be completed according to the child’s age",
                        "Records must be documented in the vaccination card or doctor’s memo",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                          <div className="size-1.5 rounded-full bg-rose-400 mt-1 shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Measles Card */}
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-rose-200 transition-colors">
                    <h4 className="font-bold text-base text-primary mb-4 uppercase tracking-wide">2. Measles</h4>
                    <ul className="space-y-3">
                      {[
                        "Usually given as part of the MMR vaccine",
                        "Two documented doses are generally required (age-appropriate)",
                        "Serology report may be accepted if vaccination records are unavailable",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                          <div className="size-1.5 rounded-full bg-rose-400 mt-1 shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* --- Verification Links --- */}
              <div className="group relative p-1 rounded-xl shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-4 md:pl-8 md:pr-2 overflow-hidden">
                {/* Subtitle / Label */}
                <div className="flex items-center gap-3 py-3 md:py-0">
                  <div className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Verification portals</span>
                </div>

                {/* Links Container */}
                <div className="flex flex-col md:flex-row w-full md:w-auto gap-2 md:gap-3 pb-3 md:pb-0 px-3 md:px-0">
                  <a
                    href="https://www.nir.cda.gov.sg/fcine/#/navpage/home"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl md:rounded-full bg-white/5 border border-white/10 text-blue-500 text-sm font-bold hover:bg-white/10 hover:text-blue-600 transition-all duration-300 group/link">
                    CDA / NIR portal
                    <ExternalLink className="size-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </a>

                  <a
                    href="#"
                    className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl md:rounded-full bg-white/5 border border-white/10 text-rose-500 text-sm font-bold hover:bg-white/10 hover:text-rose-600 transition-all duration-300 group/link">
                    NCIS schedule (SG)
                    <ExternalLink className="size-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </a>
                </div>

                {/* Subtle Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>

            {/* --- Recommended Checklist --- */}
            <div className="p-8 rounded-xl bg-blue-600 shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 size-40 bg-white/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <h3 className="text-lg font-bold tracking-tight mb-6">
                  National Childhood Immunisation Schedule (NCIS)
                </h3>
                <p className="text-xs md:text-sm text-blue-50 mb-4">
                  In addition to diphtheria and measles (required for long-term passes), parents are strongly encouraged
                  to follow the full NCIS for their child&apos;s age group.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "Tuberculosis (BCG)",
                    "Hepatitis B",
                    "Polio (IPV)",
                    "Pneumococcal",
                    "MMR",
                    "Varicella",
                    "Influenza",
                  ].map((vax, i) => (
                    <div
                      key={vax}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm group hover:bg-white/20 transition-all">
                      <span className="text-sm font-bold opacity-50">0{i + 3}</span>
                      <span className="text-sm font-semibold tracking-tight">{vax}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* --- Certification Alert --- */}
          <div className="p-8 rounded-xl bg-white border border-blue-100 shadow-sm relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="size-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Stethoscope className="size-7" />
              </div>
              <div className="space-y-1 text-center md:text-left">
                <h4 className="text-lg font-bold text-primary tracking-tight">Medical certification of records</h4>
                <p className="text-base text-slate-500 leading-relaxed max-w-3xl">
                  The <span className="text-blue-600 font-bold">Immunisation Registration / Verification Form</span>{" "}
                  should be completed and certified by a licensed medical practitioner. Please ensure the{" "}
                  <span className="font-semibold">passport number</span> used for CDA / NIR submission matches the
                  passport number used in your ICA Student’s Pass application to avoid delays.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-12 mt-24 px-4">
          {/* --- Header --- */}
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <div className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-sm font-bold uppercase tracking-widest text-indigo-600">
              Processing Guide
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-primary">
              Processing Timeline for {stpApplicationType}
            </h2>
            <p className="text-slate-500 max-w-md text-base leading-relaxed">
              A general overview of the typical steps from submission to Student’s Pass outcome.
            </p>
          </div>

          <Tabs defaultValue={getDefaultTab()} className="w-full">
            {/* --- NEW APPLICATION CONTENT --- */}
            <TabsContent value="new" className="animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
              <div className="grid lg:grid-cols-5 gap-12 items-start">
                <div className="lg:col-span-3 space-y-2 relative">
                  <div className="absolute left-7 top-4 bottom-4 w-px bg-slate-200" />
                  {[
                    {
                      week: "Week 1",
                      title: "Pre-course Counselling & Application",
                      desc: "Parents attend pre-course counselling, complete the online enrolment form and upload supporting documents.",
                    },
                    {
                      week: "Week 1–2",
                      title: "School Verification",
                      desc: "School reviews the application, checks course eligibility, and verifies originality of documents.",
                    },
                    {
                      week: "Week 2–3",
                      title: "SOLAR+ Submission",
                      desc: "Student’s particulars are entered into ICA’s SOLAR+ system and the official e‑Form is generated for completion.",
                    },
                    {
                      week: "Week 3–6",
                      title: "ICA Processing & Outcome",
                      desc: "ICA assesses the application. Once a decision is made, the school informs parents of the approval or rejection.",
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-8 group">
                      <div className="relative flex flex-col items-center">
                        <div className="size-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center z-10">
                          <div
                            className={`size-2.5 rounded-full ${i === 2 ? "bg-blue-500 animate-pulse" : "bg-slate-300"}`}
                          />
                        </div>
                      </div>
                      <div className="pb-10">
                        <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">{step.week}</span>
                        <h4 className="text-lg font-bold text-primary">{step.title}</h4>
                        <p className="text-base text-slate-500 leading-relaxed max-w-sm mt-1">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="p-8 rounded-xl bg-primary text-white shadow-xl">
                    <h4 className="text-sm font-bold uppercase tracking-widest mb-6">Recommended submission window</h4>
                    <div className="space-y-6">
                      <div className="flex gap-4 items-center">
                        <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                          <Calendar className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-300 font-bold">Earliest submission</p>
                          <p className="text-base font-semibold">Up to 3 months before course start date</p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                          <Clock className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-300 font-bold">Latest recommended</p>
                          <p className="text-base font-semibold">At least 2 months before course start date</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 rounded-xl bg-blue-50/50 border border-blue-100 flex gap-4">
                    <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-900/80 leading-relaxed">
                      <strong>Note:</strong> Processing times are indicative and may vary. You do not need to be in
                      Singapore while ICA is processing your application, and the school cannot fast‑track ICA’s
                      decision.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* --- RENEWAL CONTENT --- */}
            <TabsContent
              value="renewal"
              className="animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
              <div className="grid lg:grid-cols-5 gap-12 items-start">
                <div className="lg:col-span-3 space-y-2 relative">
                  <div className="absolute left-7 top-4 bottom-4 w-px bg-slate-200" />
                  {[
                    {
                      week: "Days 1–2",
                      title: "Data Collection",
                      desc: "Student provides current Student’s Pass card scans, updated passport details and residential address.",
                    },
                    {
                      week: "Days 3–5",
                      title: "Eligibility Check",
                      desc: "School verifies attendance, academic standing and fee payment status to ensure renewal eligibility.",
                    },
                    {
                      week: "Days 5–10",
                      title: "Renewal Submission & ICA Processing",
                      desc: "Renewal is submitted through SOLAR+. ICA reviews the case and issues the outcome.",
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-8 group">
                      <div className="relative flex flex-col items-center">
                        <div className="size-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center z-10">
                          <div className="size-2.5 rounded-full bg-emerald-500" />
                        </div>
                      </div>
                      <div className="pb-10">
                        <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">
                          {step.week}
                        </span>
                        <h4 className="text-lg font-bold text-primary">{step.title}</h4>
                        <p className="text-base text-slate-500 leading-relaxed max-w-sm mt-1">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="p-8 rounded-xl bg-primary text-white shadow-xl">
                    <h4 className="text-sm font-bold uppercase tracking-widest mb-6 text-white0">Renewal checklist</h4>
                    <ul className="space-y-4">
                      {[
                        "Current Student’s Pass card (front and back)",
                        "Valid passport (at least 6 months validity)",
                        "Updated Singapore residential address",
                        "Satisfactory attendance and academic records",
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-3 text-base text-white">
                          <CheckCircle2 className="size-4 text-emerald-200" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 rounded-xl bg-emerald-50/50 border border-emerald-100 flex gap-4">
                    <RefreshCcw className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-900/80 leading-relaxed">
                      Submit your renewal application at least{" "}
                      <strong>1 month before your current Student’s Pass expiry</strong> to reduce the risk of gaps in
                      your legal stay in Singapore.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* --- TRANSFER CONTENT --- */}
            <TabsContent
              value="transfer"
              className="animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
              <div className="grid lg:grid-cols-5 gap-12 items-start">
                <div className="lg:col-span-3 space-y-2 relative">
                  <div className="absolute left-7 top-4 bottom-4 w-px bg-slate-200" />
                  {[
                    {
                      week: "Week 1",
                      title: "Current School Clearance",
                      desc: "Obtain official withdrawal / clearance documents and, where applicable, transfer approval from your current school.",
                    },
                    {
                      week: "Week 1–2",
                      title: "HFSE Application & Offer",
                      desc: "Submit your HFSE application and receive a Letter of Offer once admission is approved.",
                    },
                    {
                      week: "Week 2–4",
                      title: "Transfer Application to ICA",
                      desc: "HFSE submits the transfer-related Student’s Pass application. ICA reviews your case under the new school.",
                    },
                    {
                      week: "Final Step",
                      title: "New Pass Issuance",
                      desc: "Once approved, your new Student’s Pass will be issued under HFSE International School as the sponsoring PEI.",
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-8 group">
                      <div className="relative flex flex-col items-center">
                        <div className="size-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center z-10">
                          <div className={`size-2.5 rounded-full ${i === 2 ? "bg-amber-500" : "bg-slate-300"}`} />
                        </div>
                      </div>
                      <div className="pb-10">
                        <span className="text-sm font-bold text-amber-600 uppercase tracking-widest">{step.week}</span>
                        <h4 className="text-lg font-bold text-primary">{step.title}</h4>
                        <p className="text-base text-slate-500 leading-relaxed max-w-sm mt-1">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="p-8 rounded-xl bg-amber-600 text-white shadow-xl relative overflow-hidden">
                    <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center mb-6">
                      <ShieldAlert className="size-6" />
                    </div>
                    <h4 className="text-lg font-bold mb-2">Key reminders</h4>
                    <p className="text-base text-amber-50/90 leading-relaxed">
                      You should <strong>not start classes at HFSE</strong> until ICA has approved the new Student’s
                      Pass. Your current pass should remain valid during the transfer process. If there is a long break
                      after expiry, ICA may require a fresh application as a new Student’s Pass case.
                    </p>
                  </div>
                  <div className="p-6 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-bold uppercase tracking-widest mb-4 text-slate-400 text-center">
                      Typical documents requested
                    </h4>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <FileCheck className="size-5 text-amber-600 shrink-0" />
                      <span className="text-sm font-semibold text-slate-700">
                        Withdrawal / clearance letter from previous PEI, HFSE Letter of Offer, and current Student’s
                        Pass details.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* SECTION HEADER */}
        <div className="mt-24 text-center space-y-4">
          <Separator />
          <br />
          <br />
          <div className="w-max mx-auto px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border border-amber-300 shadow-md shadow-amber-100/50">
            Action Required
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-amber-700">
            Please Review and Acknowledge the Information Below
          </h2>
          <p className="text-slate-600 mx-auto max-w-md text-base leading-relaxed">
            Kindly read each section carefully and tick the checkbox to confirm your understanding before continuing
            with the application.
          </p>
        </div>

        {/* Acknowledgement Cards */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-amber-50/30 border border-slate-200 p-8 md:p-12 shadow-sm space-y-12">
            {/* 1. Header & Info Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Student's Pass Card */}
              <div className="group p-8 rounded-2xl border border-slate-200 bg-white shadow-md hover:shadow-xl transition-all duration-300 space-y-6 hover:border-amber-700/30">
                <div className="flex items-center gap-3">
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
                      Submit <strong>all required documents</strong> through the online enrolment portal so the school
                      can verify and prepare your ICA submission.
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
                    icaAcknowledged ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-slate-50 border-slate-200",
                  )}>
                  <label className="flex items-start gap-3 cursor-pointer group/checkbox">
                    <input
                      type="checkbox"
                      checked={icaAcknowledged}
                      onChange={() => setIcaAcknowledged(!icaAcknowledged)}
                      className="mt-1 size-5 accent-amber-700 cursor-pointer"
                    />
                    <span
                      className={cn(
                        "text-sm font-semibold transition-colors",
                        icaAcknowledged ? "text-amber-800" : "text-slate-700",
                      )}>
                      I understand that HFSE provides assistance, but ICA alone decides the Student's Pass approval and
                      the school cannot guarantee the outcome.
                    </span>
                  </label>
                </div>
              </div>

              {/* Fees Card */}
              <div className="group p-8 rounded-2xl border border-slate-200 bg-white shadow-md hover:shadow-xl transition-all duration-300 space-y-6 hover:border-amber-700/30">
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
                  <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-sm">
                    <p className="font-bold text-red-600 mb-1">ICA Application Fees</p>
                    <p className="text-slate-600">
                      Government fees paid to ICA for <strong>Student's Pass processing and issuance</strong> are{" "}
                      <strong>non-refundable in all cases</strong>.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 text-sm">
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
                    feesAcknowledged ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-slate-50 border-slate-200",
                  )}>
                  <label className="flex items-start gap-3 cursor-pointer group/checkbox">
                    <input
                      type="checkbox"
                      checked={feesAcknowledged}
                      onChange={() => setFeesAcknowledged(!feesAcknowledged)}
                      className="mt-1 size-5 accent-amber-700 cursor-pointer"
                    />
                    <span
                      className={cn(
                        "text-sm font-semibold transition-colors",
                        feesAcknowledged ? "text-amber-800" : "text-slate-700",
                      )}>
                      I understand that ICA Student's Pass fees are non-refundable and that school tuition fee refunds
                      follow the Student Contract.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* 2. Pre-Course Counselling Section */}
            <div className="rounded-2xl bg-white border border-amber-200 p-8 space-y-6 shadow-sm">
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
                    className="size-5 accent-amber-700"
                  />
                  <span className="text-sm font-medium text-slate-600">
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
                    className="size-5 accent-amber-700"
                  />
                  <span className="text-sm font-medium text-slate-600">
                    No, I have not completed Pre-Course Counselling yet.
                  </span>
                </label>
              </div>

              {preCourseAnswer === "Yes" && (
                <div className="pt-4 border-t border-slate-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm font-semibold text-red-600">
                    * Select the date you signed the Pre-Course Counselling Acknowledgement
                  </p>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-48 justify-between">
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
                <div className="flex items-center gap-2 font-semibold p-4 rounded-lg bg-amber-50 text-amber-700 text-sm border border-amber-200 animate-in fade-in">
                  <AlertTriangle className="size-4" />
                  Our Admissions Officer will contact you to arrange a Pre-Course Counselling session before you proceed
                  with enrolment.
                </div>
              )}
            </div>

            {/* 3. Final CTA */}
            <div className="text-center space-y-6 pt-6">
              <div className="space-y-2">
                <h4
                  className={cn(
                    "text-3xl font-black transition-colors",
                    canContinue ? "text-primary" : "text-slate-400",
                  )}>
                  Ready to begin?
                </h4>
                <p
                  className={cn(
                    "text-sm font-bold transition-all",
                    !canContinue ? "text-amber-600 italic" : "text-emerald-600",
                  )}>
                  {!canContinue
                    ? "Please complete all acknowledgements above before continuing."
                    : "All acknowledgements are completed. You may proceed to the application form."}
                </p>
              </div>

              <Button
                onClick={redirect}
                size="lg"
                disabled={!canContinue}
                className="!h-16 !px-12 rounded-2xl text-xs font-black uppercase tracking-widest">
                Continue to Application Form
                <ArrowRight className="ml-3 size-4" />
              </Button>

              <div className="flex items-center justify-center gap-2 text-slate-600">
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
          <div className="flex items-center gap-4">
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
            <Button className="!px-8 !py-8 rounded-2xl bg-blue-600 text-white text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 gap-4">
              <PhoneCall /> Contact Admissions
            </Button>
          </a>
        </div>
      </MaxWidthWrapper>
    </>
  );
}

interface ScrollDownButtonProps {
  label?: string;
  scrollPercentage?: number;
}

function ScrollDownButton({ label = "Scroll down", scrollPercentage = 0.8 }: ScrollDownButtonProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleScroll = () => {
    const scrollAmount = window.innerHeight * scrollPercentage;

    window.scrollBy({
      top: scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const TOP_THRESHOLD = 150;
    const BOTTOM_THRESHOLD = 200;
    const handleWindowScroll = () => {
      const scrollY = window.scrollY;
      const scrollPosition = window.innerHeight + scrollY;
      const pageHeight = document.documentElement.scrollHeight;

      const isNearTop = scrollY < TOP_THRESHOLD;
      const isNearBottom = scrollPosition >= pageHeight - BOTTOM_THRESHOLD;

      if (isNearTop || isNearBottom) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    handleWindowScroll();

    window.addEventListener("scroll", handleWindowScroll);
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={handleScroll}
          aria-label={label}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="cursor-pointer animate-bounce fixed bottom-12 right-12 z-50 group flex flex-col items-center gap-2 active:scale-95">
          {/* Label */}
          <span className="px-4 py-1.5 rounded-full bg-white text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 transition-transform group-hover:-translate-y-1">
            {label}
          </span>

          {/* Glow Button */}
          <div
            className={cn(
              "flex items-center justify-center size-14 rounded-full transition-all duration-500",
              "bg-blue-600 text-white border-2 border-blue-50",
              "shadow-[0_15px_30px_-5px_rgba(37,99,235,0.3)]",
              "group-hover:shadow-[0_20px_40px_rgba(37,99,235,0.5)] group-hover:border-blue-100",
            )}>
            <ChevronDown className="size-6 stroke-3" />
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default STPGuidelines;
