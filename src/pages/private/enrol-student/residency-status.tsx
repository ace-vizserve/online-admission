import MaxWidthWrapper from "@/components/max-width-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { applicationTypes } from "@/data";
import { cn } from "@/lib/utils";
import { usePassTypeStore, useSelectAcademicYear, useSelectSchoolFee } from "@/zustand-store";
import { Description, Field, Label, Radio, RadioGroup } from "@headlessui/react";
import { DotPulse } from "ldrs/react";
import { ArrowLeft, ArrowRight, CircleCheck, FileCheck2, Globe2, Landmark } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

function OtherPassTypes({ isSelected }: { isSelected: boolean }) {
  const passType = usePassTypeStore((state) => state.passType);
  const setPassType = usePassTypeStore((state) => state.setPassType);

  return (
    <div className="mb-5 space-y-2">
      {" "}
      <Label
        className={cn("text-[11px] font-black uppercase tracking-[0.1em] text-blue-900/60", {
          "text-destructive": isSelected && passType === "",
        })}>
        Specify Pass Type{" "}
      </Label>{" "}
      <Select onValueChange={setPassType} value={passType}>
        {" "}
        <SelectTrigger
          className={cn(
            "h-11 w-full border-blue-200 bg-white/50 transition-all focus:ring-blue-500",
            "hover:bg-white hover:border-blue-400 group-data-[checked]:border-blue-300",
            { "!border-destructive": isSelected && passType === "" },
          )}>
          <SelectValue placeholder="Select a pass type" />{" "}
        </SelectTrigger>{" "}
        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
          {" "}
          <SelectItem value={"Long Term Visit Pass"} className="py-3 text-sm focus:bg-blue-50 focus:text-blue-900">
            Long Term Visit Pass{" "}
          </SelectItem>{" "}
          <SelectItem value={"Dependent Pass"} className="py-3 text-sm focus:bg-blue-50 focus:text-blue-900">
            Dependent Pass{" "}
          </SelectItem>{" "}
        </SelectContent>{" "}
      </Select>{" "}
    </div>
  );
}

function LocalPassTypes({ isSelected }: { isSelected: boolean }) {
  const passType = usePassTypeStore((state) => state.passType);
  const setPassType = usePassTypeStore((state) => state.setPassType);

  return (
    <div className="mb-5 space-y-2">
      {" "}
      <Label
        className={cn("text-[11px] font-black uppercase tracking-[0.1em] text-blue-900/60", {
          "text-destructive": isSelected && passType === "",
        })}>
        Specify Residency{" "}
      </Label>{" "}
      <Select onValueChange={setPassType} value={passType}>
        {" "}
        <SelectTrigger
          className={cn(
            "h-11 w-full border-blue-200 bg-white/50 transition-all focus:ring-blue-500",
            "hover:bg-white hover:border-blue-400 group-data-[checked]:border-blue-300",
            { "!border-destructive": isSelected && passType === "" },
          )}>
          <SelectValue placeholder="Select a pass type" />{" "}
        </SelectTrigger>{" "}
        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
          {" "}
          <SelectItem value={"Singaporean"} className="py-3 text-sm focus:bg-blue-50 focus:text-blue-900">
            Singaporean{" "}
          </SelectItem>{" "}
          <SelectItem value={"Singapore PR"} className="py-3 text-sm focus:bg-blue-50 focus:text-blue-900">
            Singapore PR{" "}
          </SelectItem>{" "}
        </SelectContent>{" "}
      </Select>{" "}
    </div>
  );
}

export default function StudentResidencyPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { enroleeType, enroleeNumber, currentPass } = state;

  const isNonSTP = ["Long Term Visit Pass", "Dependent Pass"].includes(currentPass);
  const isSTP = currentPass === "Student Pass";
  const isLocal = ["Singapore PR", "Singaporean"].includes(currentPass);

  const residencyOptions = [
    {
      id: "new",
      value: "New Student Pass Application",
      title: "Needs NEW Student's Pass",
      badge: "School Assistance Included",
      desc: "International student with no current Student's Pass. HFSE will submit a new application to ICA on your behalf.",
      icon: Globe2,
      detailsTitle: "What happens next:",
      details: [
        "You provide required documents during enrolment",
        "School compiles and submits application to ICA",
        "School tracks application status",
        "Typical processing: several weeks (ICA dependent)",
      ],
      willRender: true,
    },
    {
      id: "existing",
      value: "Student Pass Transfer Application",
      title: "STP Transfer from Another PEI",
      badge: "Transfer Assistance",
      desc: "Currently holds a valid Student's Pass from another institution. HFSE will assist with transferring sponsorship.",
      icon: FileCheck2,
      detailsTitle: "What you need:",
      details: ["Current pass number and expiry date", "Copy of existing Student's Pass", "Previous school details"],
      willRender: enroleeType === "New",
    },
    {
      id: "stp",
      value: "Student Pass",
      title: "Valid Student's Pass (Current HFSE Student)",
      badge: "Skip New Application",
      desc: "Current HFSE student with a valid Student's Pass covering this enrolment period. No new ICA application is required.",
      icon: CircleCheck,
      detailsTitle: "Eligibility Confirmed:",
      details: [
        "Valid HFSE Student's Pass",
        "Pass covers the new academic year",
        "No additional ICA action needed",
        "Proceed to enrolment documents",
      ],
      willRender: enroleeType === "Current",
    },
    {
      id: "non-stp",
      title: "Non-Student Pass Application",
      badge: "No Student's Pass Required",
      desc: "For students enrolling using a Long Term Visit Pass or Dependant's Pass.",
      icon: Landmark,
      detailsTitle: "Specify Pass Type:",
      details: ["Identity document", "Valid residency or pass documentation"],
      passTypes: OtherPassTypes,
      willRender: true,
    },
    {
      id: "citizen",
      title: "Singapore Citizen or PR",
      badge: "No Pass Required",
      desc: "No Student's Pass required. Standard school enrolment process applies.",
      icon: Landmark,
      detailsTitle: "Specify Residency:",
      details: ["NRIC / Birth certificate", "Proof of residency"],
      passTypes: LocalPassTypes,
      willRender: true,
    },
  ];

  const [selected, setSelected] = useState<(typeof residencyOptions)[number] | null>(null);

  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const passType = usePassTypeStore((state) => state.passType);
  const stpApplicationType = usePassTypeStore((state) => state.stpApplicationType);
  const setStpApplicationType = usePassTypeStore((state) => state.setStpApplicationType);
  const setPassType = usePassTypeStore((state) => state.setPassType);
  const clearSchoolFeeState = useSelectSchoolFee((state) => state.clearState);
  const clearState = useSelectAcademicYear((state) => state.clearState);

  const [isLoading, setTransition] = useTransition();

  function goBack() {
    setTransition(() => {
      clearState();
      clearSchoolFeeState();
      sessionStorage.clear();
    });
  }

  useEffect(() => {
    if (!selected) return;
    if (applicationTypes.includes(selected.value || "")) {
      setPassType("");
      setStpApplicationType(selected.value!);
    } else {
      setPassType(selected.value || passType);
      setStpApplicationType("");
    }
  }, [selected, setPassType, setStpApplicationType, applicationTypes, passType]);

  function redirect() {
    if ((isNonSTP || isLocal) && passType && passType !== currentPass) {
      toast.error("Selected Pass Type Does Not Match!", {
        description: "The selected pass type does not match what the student currently holds.",
      });
      return;
    }

    if (applicationTypes.includes(stpApplicationType)) {
      navigate("/enrol-student/stp-guidelines", {
        state: { enroleeNumber, enroleeType },
      });
      return;
    }

    const url =
      enroleeType === "Current"
        ? `/enrol-student/${enroleeNumber}/student-info?academicYear=${academicYear}`
        : `/enrol-student/new/student-info?academicYear=${academicYear}`;

    navigate(url, {
      state: {
        enroleeType,
        enroleeNumber,
      },
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <DotPulse size="50" speed="1.3" color="#1F45C7" />
      </div>
    );
  }

  const mustChoosePassType = selected && (selected.id === "non-stp" || selected.id === "citizen");
  const disableContinue = !selected || (mustChoosePassType && !passType);

  return (
    <>
      <div className="w-full sticky top-0 z-20 bg-white/70 backdrop-blur-lg h-20 md:h-24 flex items-center border-b">
        <MaxWidthWrapper className="w-full max-w-screen-2xl px-4 md:px-6">
          <Link
            onClick={goBack}
            to={"/admission/dashboard"}
            className={buttonVariants({
              variant: "link",
              className: "gap-2 !font-bold",
            })}>
            <ArrowLeft /> Go back
          </Link>
        </MaxWidthWrapper>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col min-h-screen bg-slate-50">
        <header className="px-6 mt-12 text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-balance">Student Residency Status</h1>
          <p className="text-lg md:text-xl text-muted-foreground text-pretty">
            Select the appropriate residency or pass status so we can apply the correct ICA process.
          </p>
        </header>

        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
          <RadioGroup value={selected} onChange={setSelected} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {residencyOptions.map((option) => {
              if (!option.willRender) return null;

              const Icon = option.icon;
              const isChecked = selected?.id === option.id;

              let disabled = false;
              if (isNonSTP) {
                if (option.id === "stp" || option.id === "citizen") disabled = true;
              }
              if (isLocal) {
                if (option.id === "non-stp" || option.id === "new" || option.id === "existing" || option.id === "stp")
                  disabled = true;
              }
              if (isSTP && enroleeType === "Current") {
                if (option.id === "existing" || option.id === "non-stp" || option.id === "citizen") {
                  disabled = true;
                }
              }

              return (
                <Field key={option.id}>
                  <Radio
                    disabled={disabled}
                    value={option}
                    className={cn(
                      "h-full group relative flex flex-col w-full cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 shadow-sm",
                      "border-white bg-white hover:border-blue-200 hover:shadow-md",
                      "data-[checked]:border-blue-600 data-[checked]:bg-blue-50/50 data-[checked]:shadow-blue-100",
                      disabled && "opacity-50 cursor-not-allowed hover:border-white hover:shadow-sm",
                    )}>
                    <div className="flex items-start gap-5 mb-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-data-[checked]:bg-blue-600 group-data-[checked]:text-white">
                        <Icon size={28} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Label className="text-lg font-bold text-slate-900 group-data-[checked]:text-blue-900">
                            {option.title}
                          </Label>
                        </div>
                        {option.badge && (
                          <span className="w-fit text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700 group-data-[checked]:bg-blue-600 group-data-[checked]:text-white transition-colors">
                            {option.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <Description className="text-sm text-slate-600 leading-relaxed mb-6 group-data-[checked]:text-blue-800/80">
                      {option.desc}
                    </Description>

                    <div className="mt-auto pt-5 border-t border-slate-100 group-data-[checked]:border-blue-200">
                      {option.passTypes && <option.passTypes isSelected={isChecked} />}
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-data-[checked]:text-blue-900 mb-3">
                        {option.detailsTitle}
                      </p>
                      <ul className="space-y-2">
                        {option.details.map((detail, idx) => (
                          <li
                            key={idx}
                            className="font-medium flex items-start gap-2 text-[13px] text-slate-500 group-data-[checked]:text-blue-800/70">
                            <div className="h-1.5 w-1.5 mt-1.5 rounded-full bg-slate-300 group-data-[checked]:bg-blue-400 shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Radio>
                </Field>
              );
            })}
          </RadioGroup>
        </main>

        <footer className="px-6 sticky bottom-0 bg-white border-t py-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            <button
              type="button"
              onClick={disableContinue ? undefined : redirect}
              className={buttonVariants({
                className: cn(
                  "h-14 !rounded-xl shadow-xl transition-all !gap-3 !font-black !uppercase w-full flex items-center justify-center",
                  disableContinue && "pointer-events-none opacity-50 grayscale",
                ),
              })}>
              Continue to Application
              <ArrowRight size={20} />
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
