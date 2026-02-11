import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Added Accordion imports
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeftRight,
  Ban,
  BookOpen,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Compass,
  CreditCard,
  ExternalLink,
  FileBadge,
  FileCheck,
  FileCheck2,
  FileText,
  Globe,
  Globe2,
  GraduationCap,
  Handshake,
  Heart,
  HelpCircle,
  Info,
  LogOut,
  PhoneCall,
  ReceiptText,
  RefreshCcw,
  RotateCcw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";

function AdmissionGuidelines() {
  const [selectedApplicationType, setSelectedApplicationType] = useState<"general" | "student-pass">("general");

  return (
    <div className="relative w-full min-h-screen bg-[#FAFBFF]">
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="text-primary">Admission Requirements</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about joining HFSE International School — where every child succeeds, one happy
            family at a time
          </p>

          {/* Key Values */}
          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-blue-100">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-base font-medium text-gray-700">Family-Centered</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-blue-100">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-base font-medium text-gray-700">Christian Values</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-blue-100">
              <Globe className="w-4 h-4 text-green-600" />
              <span className="text-base font-medium text-gray-700">Global Citizens</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-xl mx-auto mb-12 h-16 p-2 rounded-full bg-slate-100/80 border border-slate-200/50 backdrop-blur-md shadow-inner relative">
            <TabsTrigger
              value="general"
              onClick={() => setSelectedApplicationType("general")}
              className="group rounded-full h-full flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.15em] transition-all duration-500
               data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-[0_8px_20px_-6px_rgba(37,99,235,0.2)] 
               data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-slate-600 focus-visible:outline-none">
              <div
                className="size-8 rounded-full flex items-center justify-center transition-all duration-500 
                    group-data-[state=active]:bg-blue-50 group-data-[state=active]:scale-110">
                <ShieldCheck className="size-4 transition-transform group-hover:rotate-3" />
              </div>
              <span>General Requirements</span>
            </TabsTrigger>

            <TabsTrigger
              value="student-pass"
              onClick={() => setSelectedApplicationType("student-pass")}
              className="group rounded-full h-full flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.15em] transition-all duration-500
               data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-[0_8px_20px_-6px_rgba(37,99,235,0.2)] 
               data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-slate-600 focus-visible:outline-none">
              <div
                className="size-8 rounded-full flex items-center justify-center transition-all duration-500 
                    group-data-[state=active]:bg-blue-50 group-data-[state=active]:scale-110">
                <Globe className="size-4 transition-transform group-hover:-rotate-3" />
              </div>
              <span>Student Pass</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="border border-gray-100 shadow-2xl mb-12">
              <CardHeader className="space-y-4 pb-8 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-base font-semibold bg-blue-50 text-blue-700 border-blue-200">
                    Important Guidelines
                  </Badge>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">Admission Requirements</CardTitle>
                <p className="text-gray-600">
                  Please review all requirements carefully before applying to join our HAPI family
                </p>
              </CardHeader>

              {/* Refactored Requirements Section in CardContent */}
              <CardContent className="pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* The original requirements.map content will go here */}
                  <div className="group flex gap-4 rounded-xl border border-slate-100 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center transition-colors group-hover:bg-blue-600">
                        <Heart className="w-6 h-6 text-blue-600 transition-colors group-hover:text-white" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Badge
                        variant="outline"
                        className="uppercase text-sm font-bold tracking-wider text-blue-500 border-blue-100">
                        Values
                      </Badge>
                      <p className="text-base text-slate-600 leading-relaxed font-medium">
                        HFSE mission, vision and virtues are based on Christian teachings and we require all students to
                        attend our Christian Living/Values Education & Language class. While all are eligible applicants
                        regardless of nationality, culture, race or religion are welcome, it is advised that applicants
                        and their parents should be comfortable with these school practices.
                      </p>
                    </div>
                  </div>
                  <div className="group flex gap-4 rounded-xl border border-slate-100 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center transition-colors group-hover:bg-blue-600">
                        <Shield className="w-6 h-6 text-blue-600 transition-colors group-hover:text-white" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Badge
                        variant="outline"
                        className="uppercase text-sm font-bold tracking-wider text-blue-500 border-blue-100">
                        Commitment
                      </Badge>
                      <p className="text-base text-slate-600 leading-relaxed font-medium">
                        Student/Parent/Guardian have read, understood, agreed to and will comply with all the
                        requirements especially in the strict discipline of the school.
                      </p>
                    </div>
                  </div>
                  <div className="group flex gap-4 rounded-xl border border-slate-100 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center transition-colors group-hover:bg-blue-600">
                        <AlertCircle className="w-6 h-6 text-blue-600 transition-colors group-hover:text-white" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Badge
                        variant="outline"
                        className="uppercase text-sm font-bold tracking-wider text-blue-500 border-blue-100">
                        Policy
                      </Badge>
                      <p className="text-base text-slate-600 leading-relaxed font-medium">
                        Any person who smokes, drinks alcoholic beverages, uses prohibited drugs or abuse illegal
                        substances will not be admitted.
                      </p>
                    </div>
                  </div>
                  <div className="group flex gap-4 rounded-xl border border-slate-100 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center transition-colors group-hover:bg-blue-600">
                        <CheckCircle2 className="w-6 h-6 text-blue-600 transition-colors group-hover:text-white" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Badge
                        variant="outline"
                        className="uppercase text-sm font-bold tracking-wider text-blue-500 border-blue-100">
                        Academic
                      </Badge>
                      <p className="text-base text-slate-600 leading-relaxed font-medium">
                        Anyone seeking admission must be of good conduct and have attendance of no less than 80% in the
                        previous school.
                      </p>
                    </div>
                  </div>
                  <div className="group flex gap-4 rounded-xl border border-slate-100 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center transition-colors group-hover:bg-blue-600">
                        <BookOpen className="w-6 h-6 text-blue-600 transition-colors group-hover:text-white" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Badge
                        variant="outline"
                        className="uppercase text-sm font-bold tracking-wider text-blue-500 border-blue-100">
                        Academic
                      </Badge>
                      <p className="text-base text-slate-600 leading-relaxed font-medium">
                        A student who has studied in a Singapore government or government-aided school and is seeking
                        admission into a certain class level must have passed the previous level.
                      </p>
                    </div>
                  </div>
                  <div className="group flex gap-4 rounded-xl border border-slate-100 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center transition-colors group-hover:bg-blue-600">
                        <BookOpen className="w-6 h-6 text-blue-600 transition-colors group-hover:text-white" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Badge
                        variant="outline"
                        className="uppercase text-sm font-bold tracking-wider text-blue-500 border-blue-100">
                        Academic
                      </Badge>
                      <p className="text-base text-slate-600 leading-relaxed font-medium">
                        A student who has not studied in a Singapore government or government-aided school previously
                        and is seeking admission must take a placement test in Mathematics and English and must pass
                        both subjects before they are qualified for admission.
                      </p>
                    </div>
                  </div>
                  <div className="group flex gap-4 rounded-xl border border-slate-100 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center transition-colors group-hover:bg-blue-600">
                        <AlertCircle className="w-6 h-6 text-blue-600 transition-colors group-hover:text-white" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Badge
                        variant="outline"
                        className="uppercase text-sm font-bold tracking-wider text-blue-500 border-blue-100">
                        Academic
                      </Badge>
                      <p className="text-base text-slate-600 leading-relaxed font-medium">
                        Students who fail in one or both subject/s and intend to downgrade to a lower level will still
                        need to sit and pass the placement test for that level.
                      </p>
                    </div>
                  </div>
                  <div className="group flex gap-4 rounded-xl border border-slate-100 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center transition-colors group-hover:bg-blue-600">
                        <Users className="w-6 h-6 text-blue-600 transition-colors group-hover:text-white" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Badge
                        variant="outline"
                        className="uppercase text-sm font-bold tracking-wider text-blue-500 border-blue-100">
                        Privacy
                      </Badge>
                      <p className="text-base text-slate-600 leading-relaxed font-medium">
                        Student/Parent/Guardian will treat all information received in the application forms as private
                        and confidential and any dissemination, distribution or duplication of such information, unless
                        required by law or other statutory regulations is strictly prohibited and is the sole property
                        of HFSE International School.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-12 pb-8 flex-col items-stretch border-t border-gray-100 bg-gradient-to-br from-blue-50/50 to-amber-50/50">
                <EducationLevelTable />
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="student-pass">
            <div className="relative space-y-10 mb-20 p-8 rounded-xl bg-gradient-to-b from-white to-slate-50/50 border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)]">
              {/* --- Floating Status Pill --- */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-blue-100 shadow-[0_2px_10px_rgba(37,99,235,0.08)]">
                <div className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-blue-600"></span>
                </div>
                <span className="text-sm font-bold uppercase tracking-[0.1em] text-blue-600">
                  ICA Student’s Pass Support
                </span>
              </div>

              <div className="space-y-6">
                {/* --- Large Pill Header --- */}
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary leading-tight">
                  Student’s Pass{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
                    International Services
                  </span>
                </h1>

                <div className="space-y-8">
                  {/* --- Intro copy --- */}
                  <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                    HFSE International School supports families through every step of the ICA Student’s Pass process —
                    from first-time applications to renewals and transfers between PEIs. Our Admissions team handles the
                    technical details and compliance checks, so you can focus on preparing your child for school.
                  </p>

                  <p className="text-base md:text-base text-slate-500 leading-relaxed">
                    For each Student’s Pass case, we guide parents on required documents, timelines, and obligations,
                    such as attendance requirements and key Singapore regulations that apply to international students.
                  </p>

                  {/* --- Service Pills --- */}
                  <div className="flex flex-wrap gap-3">
                    {["New Applications", "Student’s Pass Renewals", "Student’s Pass Transfers (PEI to PEI)"].map(
                      (service) => (
                        <div
                          key={service}
                          className="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-black uppercase tracking-wider text-slate-500 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 hover:shadow-[0_0_15px_rgba(37,99,235,0.1)] cursor-default">
                          {service}
                        </div>
                      ),
                    )}
                  </div>

                  {/* --- System Highlight Card --- */}
                  <div className="p-6 rounded-xl bg-blue-600 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 size-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />

                    <div className="flex items-start gap-5 relative z-10">
                      <div className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                        <Globe className="size-6 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-base font-bold tracking-wide uppercase opacity-90">
                          SOLAR+ Digital Submission
                        </h4>
                        <p className="text-base leading-relaxed text-blue-50 font-medium">
                          Our Admissions team prepares and submits applications through ICA’s SOLAR+ system, checking
                          residence history, vaccination information, and PEI details for accuracy before submission.
                          This helps minimise errors, avoid delays, and keep each application aligned with current ICA
                          guidelines.
                        </p>
                        <p className="text-base leading-relaxed text-blue-100">
                          Parents will still review and sign the required forms, while the school manages the
                          configuration of Student’s Pass application type (new, renewal, or transfer) and the
                          supporting information that ICA requires.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* --- ICA Authority Pill --- */}
              <div className="relative group p-6 rounded-xl bg-white/60 border border-slate-200/60 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_20px_40px_rgba(37,99,235,0.06)] hover:border-blue-200/60">
                <div className="flex items-start gap-4">
                  {/* Icon Glow */}
                  <div className="flex-shrink-0 size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-[inset_0_0_10px_rgba(37,99,235,0.1)] group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    <ShieldAlert className="size-6" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black uppercase tracking-[0.2em] text-blue-600/80">Regulatory</span>
                      <div className="h-px w-8 bg-blue-100" />
                    </div>
                    <h3 className="text-lg font-bold text-primary tracking-tight">ICA Authority</h3>
                    <p className="text-base text-slate-500 leading-relaxed font-medium">
                      The issuance of a Student's Pass is determined{" "}
                      <span className="text-primary font-bold underline decoration-blue-200 decoration-2 underline-offset-2">
                        solely by ICA
                      </span>
                      . While we provide comprehensive support, the final decision remains an external sovereign
                      process.
                    </p>
                  </div>
                </div>
              </div>

              {/* --- Non-Refundable Pill --- */}
              <div className="relative group p-6 rounded-xl bg-white/60 border border-slate-200/60 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_20px_40px_rgba(245,158,11,0.06)] hover:border-amber-200/60">
                <div className="flex items-start gap-4">
                  {/* Icon Glow (Amber) */}
                  <div className="flex-shrink-0 size-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)] group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                    <ReceiptText className="size-6" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black uppercase tracking-[0.2em] text-amber-600/80">
                        Financial Policy
                      </span>
                      <div className="h-px w-8 bg-amber-100" />
                    </div>
                    <h3 className="text-lg font-bold text-primary tracking-tight">Non-Refundable Fees</h3>
                    <p className="text-base text-slate-500 leading-relaxed font-medium">
                      All Student's Pass application fees are{" "}
                      <span className="text-primary font-bold">strictly non-refundable</span>, regardless of the
                      application outcome or subsequent withdrawal from the process.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <section className="space-y-10 mt-16">
              {/* --- Section Header --- */}
              <div className="flex flex-col items-center text-center space-y-2 mb-12">
                <Badge
                  variant="outline"
                  className="rounded-full px-4 py-1 text-xs uppercase font-black tracking-[0.2em] border-slate-200 text-slate-400">
                  Eligibility Framework
                </Badge>
                <h2 className="text-4xl font-black tracking-tighter text-primary">Who This Applies To</h2>
              </div>

              {/* --- Three Application Types Grid --- */}
              <div className="grid md:grid-cols-3 gap-8">
                {/* New Applications */}
                <div className="group relative p-8 rounded-xl bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_30px_60px_-12px_rgba(37,99,235,0.12)] hover:-translate-y-2">
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                      <div className="size-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 transition-all duration-500 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6">
                        <Globe2 className="size-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-primary leading-tight">New Student’s Pass</h3>
                        <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50 text-sm font-bold rounded-full">
                          First-time / Fresh
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                      <div className="space-y-2">
                        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Eligibility</p>
                        <ul className="space-y-2 text-base font-medium text-slate-500">
                          <li className="flex gap-2">
                            <div className="size-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                            International students enrolling at HFSE for the first time
                          </li>
                          <li className="flex gap-2">
                            <div className="size-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                            Students moving from a local / MOE school who do not currently hold a PEI Student’s Pass
                          </li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-colors">
                        <p className="text-sm font-black uppercase tracking-widest text-blue-600 mb-2">
                          Typical ICA processing
                        </p>
                        <p className="text-base font-bold text-slate-700">Around 4–6 weeks</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Renewal */}
                <div className="group relative p-8 rounded-xl bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_30px_60px_-12px_rgba(34,197,94,0.12)] hover:-translate-y-2">
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                      <div className="size-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 transition-all duration-500 group-hover:bg-green-600 group-hover:text-white group-hover:rotate-6">
                        <RefreshCcw className="size-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-primary leading-tight">Student’s Pass Renewal</h3>
                        <Badge className="bg-green-50 text-green-700 border-green-100 hover:bg-green-50 text-sm font-bold rounded-full">
                          Continuing at HFSE
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                      <div className="space-y-2">
                        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Eligibility</p>
                        <ul className="space-y-2 text-base font-medium text-slate-500">
                          <li className="flex gap-2">
                            <div className="size-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                            Existing HFSE students who are continuing their studies
                          </li>
                          <li className="flex gap-2">
                            <div className="size-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                            Current HFSE Student’s Pass is valid but approaching expiry
                          </li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-green-100 transition-colors">
                        <p className="text-sm font-black uppercase tracking-widest text-green-600 mb-2">
                          Typical ICA processing
                        </p>
                        <p className="text-base font-bold text-slate-700">About 1–2 weeks</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transfer */}
                <div className="group relative p-8 rounded-xl bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_30px_60px_-12px_rgba(147,51,234,0.12)] hover:-translate-y-2">
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                      <div className="size-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 transition-all duration-500 group-hover:bg-purple-600 group-hover:text-white group-hover:rotate-6">
                        <FileCheck2 className="size-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-primary leading-tight">Student’s Pass Transfer</h3>
                        <Badge className="bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-50 text-sm font-bold rounded-full">
                          From other PEIs
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                      <div className="space-y-2">
                        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Eligibility</p>
                        <ul className="space-y-2 text-base font-medium text-slate-500">
                          <li className="flex gap-2">
                            <div className="size-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                            Students currently holding a valid Student’s Pass under another PEI in Singapore
                          </li>
                          <li className="flex gap-2">
                            <div className="size-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                            Intend to withdraw from the current PEI and continue studies under HFSE
                          </li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-purple-100 transition-colors">
                        <p className="text-sm font-black uppercase tracking-widest text-purple-600 mb-2">
                          Typical ICA processing
                        </p>
                        <p className="text-base font-bold text-slate-700">Varies by case (several weeks is common)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Exemption Pill Card --- */}
              <div className="mt-12 p-8 rounded-xl bg-amber-50/50 border border-amber-100/50 backdrop-blur-md relative overflow-hidden group transition-all hover:shadow-[0_40px_80px_-15px_rgba(245,158,11,0.15)]">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 size-64 bg-amber-200/20 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                  <div className="size-20 rounded-3xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                    <Ban className="size-10" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-amber-900 tracking-tight">
                        Exemptions (No Student’s Pass Required)
                      </h3>
                      <p className="text-base font-medium text-amber-700/70">
                        The following residents generally do not need to apply for a separate Student’s Pass:
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Singapore Citizens",
                        "Permanent Residents (PR)",
                        "Dependent’s Pass (DP) holders",
                        "LTVP holders",
                      ].map((type) => (
                        <span
                          key={type}
                          className="px-4 py-1.5 rounded-full bg-white border border-amber-200 text-sm font-bold uppercase tracking-tighter text-amber-800 shadow-sm">
                          {type}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-amber-900/60 bg-white/40 p-3 rounded-2xl border border-amber-200/50">
                      <Info className="size-4 shrink-0" />
                      Note: DP / LTVP holders still require formal registration with the school and relevant authorities
                      before starting classes, even though a separate Student’s Pass is not needed.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-12 mt-20 px-4">
              {/* --- Pill Header --- */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 shadow-sm">
                  <FileText className="size-3 text-blue-600" />
                  <span className="text-xs font-black uppercase tracking-widest text-blue-600">
                    Documentation Portal
                  </span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter text-primary">Required Documents</h2>
                <p className="text-slate-500 max-w-lg text-base font-medium leading-relaxed">
                  Tailored requirements based on your specific application path.
                </p>
              </div>

              <Tabs defaultValue="new" className="w-full">
                {/* --- Glassmorphic Pill Track --- */}
                <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto mb-16 h-16 p-2 rounded-full bg-slate-100/80 border border-slate-200/50 backdrop-blur-md shadow-inner relative">
                  {[
                    { id: "new", label: "New", icon: Sparkles },
                    { id: "renewal", label: "Renewal", icon: RotateCcw },
                    { id: "transfer", label: "Transfer", icon: ArrowLeftRight },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="group rounded-full h-full flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.1em] transition-all duration-500
          data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg 
          data-[state=inactive]:text-slate-400 focus-visible:outline-none">
                      <tab.icon className="size-4 transition-transform group-data-[state=active]:scale-110" />
                      <span className="hidden md:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

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
                        <div className="size-16 rounded-[1.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
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
                          {["Official PEI Release Form", "Current Pass Status", "HFSE Enrollment Contract"].map(
                            (item) => (
                              <div
                                key={item}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <FileBadge className="size-5 text-amber-600" />
                                <span className="text-sm font-bold text-slate-700">{item}</span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      <div className="p-8 rounded-xl shadow-xl relative overflow-hidden bg-white border border-amber-100">
                        <AlertCircle className="size-8 text-amber-600 mb-4" />
                        <h4 className="text-lg font-black mb-2 text-primary">
                          Important notice for Student’s Pass transfers
                        </h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                          Transfers are only possible if your child currently holds a valid Student’s Pass at the time
                          of the transfer application. If there is a long gap after the pass has expired (for example,
                          more than a few months), ICA may require a fresh application to be submitted as a{" "}
                          <span className="font-semibold text-slate-800">“New Student’s Pass”</span> instead of a
                          transfer.
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
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">ICA Photo Guidelines</h3>
                    </div>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                      Submissions that fail these specs will be automatically flagged by ICA's facial recognition
                      system, causing significant delays.
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
                            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                              {item.title}
                            </p>
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
                <Button className="!px-8 !py-8 rounded-full bg-blue-600 text-white text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                  <PhoneCall /> Contact Admissions
                </Button>
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
                        className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl md:rounded-full bg-white/5 border border-white/10 text-blue-400 text-sm font-bold hover:bg-white/10 hover:text-blue-600 transition-all duration-300 group/link">
                        CDA / NIR portal
                        <ExternalLink className="size-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                      </a>

                      <a
                        href="#"
                        className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl md:rounded-full bg-white/5 border border-white/10 text-rose-200 text-sm font-bold hover:bg-white/10 hover:text-rose-600 transition-all duration-300 group/link">
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
                      In addition to diphtheria and measles (required for long-term passes), parents are strongly
                      encouraged to follow the full NCIS for their child&apos;s age group.
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
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">Processing Timeline</h2>
                <p className="text-slate-500 max-w-md text-base leading-relaxed">
                  A general overview of the typical steps from submission to Student’s Pass outcome.
                </p>
              </div>

              <Tabs defaultValue="new" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-3xl mx-auto mb-16 h-20 p-2 rounded-full bg-slate-100/80 border border-slate-200/50 backdrop-blur-md shadow-inner relative gap-1">
                  {[
                    { id: "new", label: "New", icon: Sparkles, time: "4–6 Weeks", color: "text-blue-600" },
                    { id: "renewal", label: "Renewal", icon: RotateCcw, time: "1–2 Weeks", color: "text-emerald-600" },
                    {
                      id: "transfer",
                      label: "Transfer",
                      icon: ArrowLeftRight,
                      time: "3–6 Weeks",
                      color: "text-amber-600",
                    },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="group rounded-full h-full flex flex-col items-center justify-center transition-all duration-500
      data-[state=active]:bg-white data-[state=active]:shadow-[0_10_30px_-10px_rgba(0,0,0,0.1)] 
      data-[state=inactive]:text-slate-400 focus-visible:outline-none">
                      <div className="flex items-center gap-3">
                        <tab.icon className="size-4 transition-transform group-data-[state=active]:scale-110 group-data-[state=active]:text-primary" />
                        <span className="text-sm font-black uppercase tracking-[0.15em] group-data-[state=active]:text-primary">
                          {tab.label}
                        </span>
                      </div>

                      {/* Revealable Time - This prevents the 'Tight' look by hiding it when inactive */}
                      <div className="overflow-hidden h-0 group-data-[state=active]:h-4 group-data-[state=active]:mt-1 transition-all duration-500">
                        <div className="flex items-center gap-2 opacity-0 group-data-[state=active]:opacity-100 transition-opacity">
                          <span className={`text-xs font-bold tracking-wider text-primary`}>{tab.time}</span>
                        </div>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* --- NEW APPLICATION CONTENT --- */}
                <TabsContent
                  value="new"
                  className="animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
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
                                className={`size-2.5 rounded-full ${
                                  i === 2 ? "bg-blue-500 animate-pulse" : "bg-slate-300"
                                }`}
                              />
                            </div>
                          </div>
                          <div className="pb-10">
                            <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">
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
                        <h4 className="text-sm font-bold uppercase tracking-widest mb-6">
                          Recommended submission window
                        </h4>
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
                        <h4 className="text-sm font-bold uppercase tracking-widest mb-6 text-white0">
                          Renewal checklist
                        </h4>
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
                          <strong>1 month before your current Student’s Pass expiry</strong> to reduce the risk of gaps
                          in your legal stay in Singapore.
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
                            <span className="text-sm font-bold text-amber-600 uppercase tracking-widest">
                              {step.week}
                            </span>
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
                          Pass. Your current pass should remain valid during the transfer process. If there is a long
                          break after expiry, ICA may require a fresh application as a new Student’s Pass case.
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

            <section className="relative space-y-16 mt-24 px-6">
              {/* --- Portal Header --- */}
              <div className="flex flex-col items-center text-center space-y-4 mb-20">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
                  <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm font-bold uppercase tracking-widest text-blue-600">Enrolment Journey</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">Enrolment Portal Steps</h2>
                <p className="text-slate-500 max-w-lg text-base">
                  The typical sequence from pre-course counselling to digital submission.
                </p>
              </div>

              {/* --- Timeline Container --- */}
              <div className="relative space-y-12">
                {/* Vertical Line Thread */}
                <div className="absolute left-8 top-0 bottom-0 w-px border-l-2 border-dashed border-slate-200 hidden md:block" />

                {/* --- Step 01 --- */}
                <div className="relative pl-0 md:pl-20 group">
                  <div className="absolute left-4 -top-2 md:left-4 size-8 rounded-full bg-blue-600 text-white md:flex items-center justify-center text-sm font-bold ring-8 ring-white hidden z-10">
                    01
                  </div>
                  <div className="p-8 rounded-xl bg-white border border-slate-100 shadow-sm transition-all group-hover:shadow-md">
                    <h3 className="text-xl font-bold text-primary mb-4">Pre-Course Counselling</h3>
                    <p className="text-base text-slate-500 leading-relaxed mb-4">
                      Meet with our Admissions Officer (Course Counsellor) to receive complete information about the
                      course, school policies, fees, Student’s Pass requirements (if applicable), and support services
                      before making an enrolment decision.
                    </p>
                    <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/50 flex gap-3">
                      <Info className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-indigo-900/70 leading-relaxed">
                        At the end of pre-course counselling, parents/guardians sign the{" "}
                        <span className="font-semibold">Pre-Course Counselling Acknowledgement Form</span> to confirm
                        that the information has been explained and understood, in line with EduTrust (GD4.0)
                        requirements.
                      </p>
                    </div>
                  </div>
                </div>

                {/* --- Step 02 & 03 Split Row --- */}
                <div className="relative pl-0 md:pl-20 grid md:grid-cols-2 gap-6">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 size-4 rounded-full bg-slate-200 ring-8 ring-white hidden md:block z-10" />

                  <div className="p-8 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <div className="text-sm font-bold text-blue-600 uppercase tracking-tighter mb-2">Step 02</div>
                    <h3 className="text-lg font-bold text-primary mb-2">Select Application Type</h3>
                    <p className="text-base text-slate-500 leading-relaxed mb-4">
                      Choose the correct ICA application path based on your child’s situation. Our system and Admissions
                      team will guide you if you are unsure.
                    </p>
                    <div className="flex flex-wrap gap-3 mb-3">
                      {["New Student’s Pass", "Renewal", "Transfer to HFSE"].map((type) => (
                        <div
                          key={type}
                          className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-600">
                          {type}
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/50 flex gap-3">
                      <Info className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-indigo-900/70 leading-relaxed">
                        <strong>Dependants Pass (DP) or LTVP holders:</strong> You usually do not need a separate
                        Student’s Pass. The school will advise on the correct registration steps with ICA/MOH.
                      </p>
                    </div>
                  </div>

                  <div className="p-8 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <div className="text-sm font-bold text-blue-600 uppercase tracking-tighter mb-2">Step 03</div>
                    <h3 className="text-lg font-bold text-primary mb-2">Upload Photo & Documents</h3>
                    <p className="text-base text-slate-500 leading-relaxed mb-3">
                      Provide a recent biometric passport-style photo and the required supporting documents for your
                      application type.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {["Passport Photo", "Passport & Birth Cert", "Vaccination", "Academic / Financial"].map((doc) => (
                        <span
                          key={doc}
                          className="px-2 py-1 rounded-md bg-slate-100 text-xs font-bold uppercase text-slate-500 tracking-wide">
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* --- Step 04 --- */}
                <div className="relative pl-0 md:pl-20 group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 size-8 rounded-full bg-primary text-white md:flex items-center justify-center text-sm font-bold ring-8 ring-white hidden z-10">
                    04
                  </div>
                  <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 border-dashed">
                    <h3 className="text-xl font-bold text-primary">Accuracy & Internal Review</h3>
                    <p className="text-base text-slate-500 mt-2 leading-relaxed">
                      Our <span className="text-primary font-semibold">Office of Admin and Operations</span> checks all
                      submitted information against your documents and the course requirements before preparing the
                      final ICA submission.
                      <span className="text-rose-500 font-medium italic ml-1 underline underline-offset-4 decoration-rose-200">
                        Incomplete or inconsistent information is one of the most common reasons for delays in ICA
                        processing.
                      </span>
                    </p>
                  </div>
                </div>

                {/* --- Step 05 --- */}
                <div className="relative pl-0 md:pl-20 group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 size-8 rounded-full bg-blue-600 text-white md:flex items-center justify-center text-sm font-bold ring-8 ring-white hidden z-10">
                    05
                  </div>
                  <div className="p-8 md:p-10 rounded-xl bg-primary text-white overflow-hidden shadow-xl relative">
                    <div className="absolute -right-8 -bottom-8 opacity-10">
                      <ShieldCheck className="size-40" />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20  text-sm font-bold uppercase tracking-widest">
                        Legal milestone
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight">Digital Confirmation & Submission</h3>
                      <p className="font-medium text-base max-w-xl leading-relaxed">
                        Once your details are confirmed, the school completes the e‑Form in ICA’s SOLAR+ system and
                        submits your application. You will receive instructions for any in‑principle approval (IPA) or
                        issuance appointment directly after ICA has made a decision.
                      </p>
                      <div className="p-4 bg-amber-500 w-max rounded-lg flex items-center gap-2 text-white text-sm font-bold uppercase">
                        <AlertTriangle className="size-3" /> School cannot influence or guarantee ICA processing times
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-12 mt-24 px-4">
              {/* --- Section Header --- */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                  <Scale className="size-3.5 text-slate-500" />
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-600">
                    Legal Compliance (GD4.0)
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">Pre-Course Counselling</h2>
                <p className="text-slate-500 max-w-xl text-base leading-relaxed">
                  A required briefing for prospective families to ensure course suitability, fee transparency, and
                  awareness of key Singapore regulations before confirming enrolment.
                </p>
              </div>

              {/* --- Main Container --- */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-12 space-y-12 relative overflow-hidden">
                {/* Mandatory Alert */}
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl bg-amber-50/50 border border-amber-100/60 relative">
                  <div className="size-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Handshake className="size-7" />
                  </div>
                  <div className="space-y-1 text-center md:text-left">
                    <h4 className="text-lg font-bold text-amber-900 tracking-tight">
                      Requirement: Acknowledgement of Pre-Course Counselling
                    </h4>
                    <p className="text-base text-amber-800/70 leading-relaxed">
                      Pre-course counselling is conducted by our Admissions Officer (Course Counsellor).
                      Parents/guardians must acknowledge that key course and school information has been explained
                      before the school proceeds with confirming the enrolment and, where relevant, supporting Student’s
                      Pass matters.
                    </p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid lg:grid-cols-2 gap-x-16 gap-y-10">
                  {/* Administrative Section */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-3">
                      <span className="h-px w-6 bg-slate-200" /> Administrative & Regulatory
                    </h3>
                    <ul className="space-y-4">
                      {[
                        "Types of applications (New, Renewal, Transfer) and which one applies to your child",
                        "Non-refundable nature of ICA application and processing fees",
                        "Role and limits of the school versus ICA as the approving authority",
                        "Typical Student’s Pass processing timelines and what may cause delays",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <div className="size-5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="size-3" />
                          </div>
                          <span className="text-base text-slate-600 leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Academic Section */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-3">
                      <span className="h-px w-6 bg-slate-200" /> Course, Fees & Support
                    </h3>
                    <ul className="space-y-4">
                      {[
                        "Course information, entry requirements and suitability for the student",
                        "Fee structure, payment schedules and Refund Policy terms",
                        "Available academic, pastoral and international student support services",
                        "Key references to Infectious Diseases Act and Immigration-related obligations affecting students",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <div className="size-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="size-3" />
                          </div>
                          <span className="text-base text-slate-600 leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Restriction Section */}
                <div className="p-8 rounded-xl bg-rose-50/40 border border-rose-100/60 shadow-sm">
                  <h4 className="text-rose-900 font-bold text-lg mb-6 flex items-center gap-2 justify-center md:justify-start">
                    <ShieldAlert className="size-5 text-rose-500" /> Student’s Pass Restrictions (ICA)
                  </h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      "Not allowed to work in Singapore on a Student’s Pass",
                      "No industrial attachment / internship unless separately approved with a valid work pass",
                      "Must hold a valid pass at all times while studying",
                      "Must comply with attendance and course participation requirements",
                    ].map((text, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-rose-100 shadow-sm">
                        <XCircle className="size-3.5 text-rose-400 shrink-0" />
                        <span className="text-sm font-semibold text-rose-800 leading-snug">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-8 mt-16 px-4 pb-20">
              <div className="text-center space-y-2 mb-10">
                <h2 className="text-3xl font-bold tracking-tight text-primary">Frequently Asked Questions</h2>
                <p className="text-slate-500">
                  Key information about the Student’s Pass and related enrolment processes.
                </p>
              </div>

              {/* General FAQs */}
              <Card className="border-none shadow-sm bg-white/60 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl">
                      <HelpCircle className="h-5 w-5 text-slate-600" />
                    </div>
                    <CardTitle className="text-xl text-slate-800">General Questions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="faq-1" className="border-slate-100">
                      <AccordionTrigger className="hover:no-underline py-4 text-slate-700 font-medium text-left">
                        Can the school guarantee Student’s Pass approval?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 leading-relaxed space-y-3">
                        <p>
                          No. The approval and issuance of a Student’s Pass are decided solely by the{" "}
                          <strong>Immigration & Checkpoints Authority (ICA)</strong>.
                        </p>
                        <p>
                          HFSE provides support with document checks and SOLAR+ submission, but neither HFSE nor any
                          Private Education Institution (PEI) can influence or guarantee ICA’s decision.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-2" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-4 text-slate-700 font-medium text-left">
                        Are ICA application fees refundable if my application is rejected?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 leading-relaxed">
                        <p>
                          No. ICA application and processing fees are{" "}
                          <strong>non-refundable government administrative fees</strong>. They are separate from school
                          tuition and charges.
                        </p>
                        <p>
                          If an application is rejected, only fees covered under the Student Contract Refund Policy will
                          be considered according to the terms stated in the contract.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* NEW Application FAQs */}
              <Card className="border-none shadow-sm bg-blue-50/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Globe2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl text-slate-800">NEW Application Questions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="new-faq-1" className="border-blue-100/50">
                      <AccordionTrigger className="hover:no-underline py-4 text-slate-700 font-medium text-left">
                        Can I submit the Student’s Pass application by myself?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 leading-relaxed">
                        <p className="mb-3">
                          For new international students, HFSE requires use of our{" "}
                          <strong>Student’s Pass Processing Service</strong> so that applications are accurate and
                          consistent with ICA and EduTrust requirements.
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-base italic text-slate-500">
                          <li className="flex items-center gap-2">◦ Document verification</li>
                          <li className="flex items-center gap-2">◦ SOLAR+ data entry and submission</li>
                          <li className="flex items-center gap-2">◦ PEI / ICA guideline alignment</li>
                          <li className="flex items-center gap-2">◦ Reduction of avoidable errors</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="new-faq-2" className="border-blue-100/50">
                      <AccordionTrigger className="hover:no-underline py-4 text-slate-700 font-medium text-left">
                        What are the vaccination requirements for Student’s Pass?
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="p-4 bg-white rounded-xl border border-blue-100">
                          <p className="text-base text-slate-600 mb-2">
                            Foreign-born children <strong>aged 12 years and below</strong> must show that they have been
                            vaccinated against <strong>diphtheria and measles</strong>, or have proof of immunity. These
                            records are typically checked via the National Immunisation Registry (NIR).
                          </p>
                          <a href="https://www.nir.cda.gov.sg/" className="text-sm text-blue-600 underline">
                            Visit NIR portal
                          </a>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="new-faq-3" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-4 text-slate-700 font-medium text-left">
                        Is there an entrance test?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 leading-relaxed">
                        <p>
                          Yes. Applicants will complete an <strong>English and Mathematics</strong> assessment to help
                          determine course suitability and support needs.
                        </p>
                        <p className="mt-2">
                          For students with additional learning needs (for example, ADHD or ASD), the school may use a
                          short <strong>trial class period</strong> to better understand the learner and ensure that an
                          appropriate programme and support level can be provided.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* RENEWAL Application FAQs */}
              <Card className="border-none shadow-sm bg-emerald-50/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <RefreshCcw className="h-5 w-5 text-emerald-600" />
                    </div>
                    <CardTitle className="text-xl text-slate-800">RENEWAL Application</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="ren-1" className="border-emerald-100/50">
                      <AccordionTrigger className="hover:no-underline py-4 text-slate-700 font-medium text-left">
                        When should I apply for a Student’s Pass renewal?
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 leading-relaxed">
                        <p>
                          Submit your renewal <strong>at least 1–3 months before</strong> the current pass expiry date.
                          While renewals are often processed more quickly than new applications, applying early helps
                          prevent gaps in your child’s legal stay in Singapore.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* TRANSFER & EXEMPTION Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <div className="flex items-center gap-2 mb-3">
                    <FileCheck2 className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Transfers between schools</h3>
                  </div>
                  <p className="text-base text-slate-600 leading-relaxed">
                    If your child is moving from another PEI, ICA must approve the{" "}
                    <strong>new Student’s Pass under HFSE</strong> before classes can begin. Transfer processing is
                    usually longer than a renewal and can take several weeks, depending on the case.
                  </p>
                </div>

                <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-900">DP / LTVP holders</h3>
                  </div>
                  <p className="text-base text-slate-600 leading-relaxed">
                    Children who hold a <strong>Dependent’s Pass (DP)</strong> or{" "}
                    <strong>Long-Term Visit Pass (LTVP)</strong> normally do not need a separate Student’s Pass.
                    However, HFSE is still required to register their details with the authorities before they start
                    school. No ICA Student’s Pass application fees apply in these cases.
                  </p>
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>

        <Card className="border border-gray-100 shadow-2xl overflow-hidden py-0 mt-12">
          <CardHeader className="space-y-4 pt-6 pb-6 bg-gradient-to-r from-blue-50 to-amber-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <Badge variant="secondary" className="text-base font-semibold bg-white/80 text-blue-700">
                Resources
              </Badge>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Parent Portal Guide</CardTitle>
            <p className="text-gray-600">Learn how to navigate and use the parent portal effectively</p>
          </CardHeader>

          <CardContent className="p-6">
            <div
              className="relative w-full rounded-xl overflow-hidden shadow-xl border-4 border-white"
              style={{ paddingTop: "56.25%" }}>
              <iframe
                loading="lazy"
                className="absolute top-0 left-0 w-full h-full border-none"
                src="https://www.canva.com/design/DAGsorqq-Co/lHEDFsXWfMrp4U8rsVQY-Q/view?embed"
                allowFullScreen
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 pb-8 px-6 bg-gradient-to-br from-blue-50/50 to-amber-50/50">
            <div className="space-y-1">
              <p className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Created by HFSE Creatives Team
              </p>
              <p className="text-sm text-gray-500">Last updated: 2024</p>
            </div>
            <a
              href="https://www.canva.com/design/DAGsorqq-Co/lHEDFsXWfMrp4U8rsVQY-Q/view?utm_content=DAGsorqq-Co&utm_campaign=designshare&utm_medium=embeds&utm_source=link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              View Full Guide
              <ExternalLink className="w-4 h-4" />
            </a>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function EducationLevelTable() {
  const data = [
    { level: "Primary One", completion: "Kindergarten", birth: "2018", age: 6, category: "Primary" },
    { level: "Primary Two", completion: "Primary One", birth: "2017", age: 7, category: "Primary" },
    { level: "Primary Three", completion: "Primary Two", birth: "2016", age: 8, category: "Primary" },
    { level: "Primary Four", completion: "Primary Three", birth: "2015", age: 9, category: "Primary" },
    { level: "Primary Five", completion: "Primary Four", birth: "2014", age: 10, category: "Primary" },
    { level: "Primary Six", completion: "Primary Five", birth: "2013", age: 11, category: "Primary" },
    { level: "Secondary One", completion: "Primary Six", birth: "2012", age: 12, category: "Secondary" },
    { level: "Secondary Two", completion: "Secondary One", birth: "2011", age: 13, category: "Secondary" },
    { level: "Secondary Three", completion: "Secondary Two", birth: "2010", age: 14, category: "Secondary" },
    { level: "Secondary Four", completion: "Secondary Three", birth: "2009", age: 15, category: "Secondary" },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="space-y-3 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Education Level Requirements</h3>
        </div>
        <p className="text-gray-600">Admission requirements based on student's age and academic completion</p>
      </div>

      <div className="border-2 border-gray-100 rounded-xl overflow-hidden shadow-lg bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-blue-700 border-none">
                <th className="px-6 py-4 text-left text-base font-bold text-white">Level</th>
                <th className="px-6 py-4 text-left text-base font-bold text-white">Academic Completion</th>
                <th className="px-6 py-4 text-left text-base font-bold text-white">Year of Birth</th>
                <th className="px-6 py-4 text-right text-base font-bold text-white">Age</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={index}
                  className={`transition-all duration-200 border-b border-gray-100 last:border-none ${
                    index % 2 === 0 ? "bg-white hover:bg-blue-50/50" : "bg-gray-50/50 hover:bg-blue-50/50"
                  }`}>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          row.category === "Primary" ? "bg-blue-500" : "bg-amber-500"
                        }`}
                      />
                      {row.level}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{row.completion}</td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="secondary"
                      className="font-mono font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {row.birth}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center justify-center min-w-[4rem] px-3 py-1.5 text-base font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-sm">
                      {row.age} yrs
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Footer */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-xl">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-base text-gray-700">
          <span className="font-semibold">Note:</span> All applicants must meet the age requirements by the start of the
          academic year. For specific questions about admission requirements, please contact our admissions office.
        </p>
      </div>
    </div>
  );
}

export default AdmissionGuidelines;
