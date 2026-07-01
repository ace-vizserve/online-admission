import PageMetaData from "@/components/page-metadata";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { applicationTypes, studentPassTypes } from "@/data";
import { cn } from "@/lib/utils";
import { usePassTypeStore, useSelectAcademicYear, useSelectSchoolFee } from "@/zustand-store";
import { Description, Field, Label, Radio, RadioGroup } from "@headlessui/react";
import { DotPulse } from "ldrs/react";
import { ArrowLeft, ArrowRight, CircleCheck, FileCheck2, Globe2, Landmark } from "lucide-react";
import { useState, useTransition } from "react";
import { Link, useLocation, useNavigate } from "react-router";

// Pass-type sub-choices, reused from the shared data constants.
const NON_STP_PASSES = studentPassTypes.filter((p) => ["Long Term Visit Pass", "Dependent Pass"].includes(p.value));
const LOCAL_PASSES = studentPassTypes.filter((p) => ["Singaporean", "Singapore PR"].includes(p.value));

type ResidencyOption = {
  id: string;
  title: string;
  badge?: string;
  desc: string;
  icon: typeof Globe2;
  detailsTitle: string;
  details: string[];
  /** Fixed store outputs written when this card is selected. */
  store: { stpApplicationType: string; passType: string };
  /** When present, the card needs a specific pass to be chosen (label + options). */
  passLabel?: string;
  passOptions?: { label: string; value: string }[];
  willRender: (enroleeType: string) => boolean;
};

export default function StudentResidencyPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { enroleeType, enroleeNumber, currentPass, isOpenHouseRegistration } = state;

  const isNonSTP = ["Long Term Visit Pass", "Dependent Pass"].includes(currentPass);
  const isSTP = currentPass === "Student Pass";
  const isLocal = ["Singapore PR", "Singaporean"].includes(currentPass);

  const residencyOptions: ResidencyOption[] = [
    {
      id: "new",
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
      store: { stpApplicationType: "New Student Pass Application", passType: "" },
      willRender: () => true,
    },
    {
      id: "existing",
      title: "STP Transfer from Another PEI",
      badge: "Transfer Assistance",
      desc: "Currently holds a valid Student's Pass from another institution. HFSE will assist with transferring sponsorship.",
      icon: FileCheck2,
      detailsTitle: "What you need:",
      details: ["Current pass number and expiry date", "Copy of existing Student's Pass", "Previous school details"],
      store: { stpApplicationType: "Student Pass Transfer Application", passType: "" },
      willRender: (type) => type === "New",
    },
    {
      id: "stp",
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
      store: { stpApplicationType: "", passType: "Student Pass" },
      willRender: (type) => type === "Current",
    },
    {
      id: "non-stp",
      title: "Non-Student Pass Application",
      badge: "No Student's Pass Required",
      desc: "For students enrolling using a Long Term Visit Pass or Dependant's Pass.",
      icon: Landmark,
      detailsTitle: "What you need:",
      details: ["Identity document", "Valid residency or pass documentation"],
      store: { stpApplicationType: "", passType: "" },
      passLabel: "Specify Pass Type",
      passOptions: NON_STP_PASSES,
      willRender: () => true,
    },
    {
      id: "citizen",
      title: "Singapore Citizen or PR",
      badge: "No Pass Required",
      desc: "No Student's Pass required. Standard school enrolment process applies.",
      icon: Landmark,
      detailsTitle: "What you need:",
      details: ["NRIC / Birth certificate", "Proof of residency"],
      store: { stpApplicationType: "", passType: "" },
      passLabel: "Specify Residency",
      passOptions: LOCAL_PASSES,
      willRender: () => true,
    },
  ];

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const passType = usePassTypeStore((state) => state.passType);
  const stpApplicationType = usePassTypeStore((state) => state.stpApplicationType);
  const setStpApplicationType = usePassTypeStore((state) => state.setStpApplicationType);
  const setPassType = usePassTypeStore((state) => state.setPassType);
  const clearSchoolFeeState = useSelectSchoolFee((state) => state.clearState);
  const clearState = useSelectAcademicYear((state) => state.clearState);

  const [isLoading, setTransition] = useTransition();

  const selectedOption = residencyOptions.find((option) => option.id === selectedId) ?? null;
  // A New enrolee must pick the specific pass; a Current enrolee's pass is taken from their record.
  const needsPassChoice = Boolean(selectedOption?.passOptions) && enroleeType === "New";
  const disableContinue = !selectedId || (needsPassChoice && !passType);

  // Which cards a Current enrolee may pick, based on the pass already on file.
  // New enrolees (no pass on record) may pick any rendered card.
  function isEligible(id: string) {
    if (enroleeType !== "Current") return true;
    if (isSTP) return id === "stp" || id === "new";
    if (isNonSTP) return id === "non-stp" || id === "new";
    if (isLocal) return id === "citizen";
    return true;
  }

  function handleSelect(id: string) {
    const option = residencyOptions.find((o) => o.id === id);
    if (!option) return;

    setSelectedId(id);
    setStpApplicationType(option.store.stpApplicationType);

    if (option.passOptions) {
      // Current: auto-apply the pass on file. New: clear until the parent chooses below.
      setPassType(enroleeType === "Current" ? currentPass : "");
    } else {
      setPassType(option.store.passType);
    }
  }

  function goBack() {
    setTransition(() => {
      clearState();
      clearSchoolFeeState();
      sessionStorage.clear();
    });
  }

  function redirect() {
    if (isOpenHouseRegistration) {
      navigate("/open-house/stp-guidelines", {
        state: {
          enroleeType,
          isOpenHouseRegistration,
        },
      });
      return;
    }

    navigate("/enrol-student/stp-guidelines", {
      state: {
        enroleeNumber,
        enroleeType,
        isSTP: applicationTypes.includes(stpApplicationType),
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

  return (
    <>
      <PageMetaData title="Residency Status | HFSE International School" description="Select your child's residency and pass type to proceed with enrollment." />
      <div className="w-full sticky top-0 z-20 bg-background/70 backdrop-blur-lg h-20 md:h-24 flex items-center border-b">
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

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col min-h-screen bg-muted/40">
        <header className="px-6 mt-12 text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-balance">Student Residency Status</h1>
          <p className="text-lg md:text-xl text-muted-foreground text-pretty">
            Select the appropriate residency or pass status so we can apply the correct ICA process.
          </p>
        </header>

        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
          <RadioGroup value={selectedId} onChange={handleSelect} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {residencyOptions.map((option) => {
              if (!option.willRender(enroleeType)) return null;

              const Icon = option.icon;
              const eligible = isEligible(option.id);

              return (
                <Field key={option.id}>
                  <Radio
                    disabled={!eligible}
                    value={option.id}
                    className={cn(
                      "h-full group relative flex flex-col w-full cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 shadow-sm",
                      "border-border bg-card hover:border-primary/40 hover:shadow-md",
                      "data-[checked]:border-primary data-[checked]:bg-primary/5 data-[checked]:shadow-md",
                      !eligible && "opacity-50 cursor-not-allowed hover:border-border hover:shadow-sm",
                    )}>
                    <div className="flex items-start gap-5 mb-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-data-[checked]:bg-primary group-data-[checked]:text-primary-foreground">
                        <Icon size={28} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-lg font-bold text-foreground group-data-[checked]:text-primary">
                          {option.title}
                        </Label>
                        {option.badge && (
                          <span className="w-fit text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary group-data-[checked]:bg-primary group-data-[checked]:text-primary-foreground transition-colors">
                            {option.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <Description className="text-sm text-muted-foreground leading-relaxed mb-6">
                      {option.desc}
                    </Description>

                    <div className="mt-auto pt-5 border-t border-border group-data-[checked]:border-primary/30">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground group-data-[checked]:text-primary mb-3">
                        {option.detailsTitle}
                      </p>
                      <ul className="space-y-2">
                        {option.details.map((detail, idx) => (
                          <li
                            key={idx}
                            className="font-medium flex items-start gap-2 text-sm text-muted-foreground">
                            <div className="h-1.5 w-1.5 mt-1.5 rounded-full bg-muted-foreground/40 group-data-[checked]:bg-primary shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {option.passOptions && selectedId === option.id && (
                      <div
                        className="mt-4 pt-4 border-t border-primary/30 animate-in fade-in slide-in-from-bottom-1 duration-200"
                        onClick={(e) => e.stopPropagation()}>
                        {enroleeType === "New" ? (
                          <div className="space-y-2">
                            <p className={cn("text-xs font-black uppercase tracking-[0.1em]", needsPassChoice && !passType ? "text-destructive" : "text-primary")}>
                              {option.passLabel}
                            </p>
                            <Select value={passType} onValueChange={setPassType}>
                              <SelectTrigger className={cn("h-11 w-full bg-background", needsPassChoice && !passType && "!border-destructive")}>
                                <SelectValue placeholder="Select a pass type" />
                              </SelectTrigger>
                              <SelectContent>
                                {option.passOptions.map((pass) => (
                                  <SelectItem key={pass.value} value={pass.value} className="py-3 text-sm">
                                    {pass.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
                            <span className="text-muted-foreground">Using the pass on file: </span>
                            <span className="font-bold text-primary">{currentPass}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Radio>
                </Field>
              );
            })}
          </RadioGroup>

        </main>

        <footer className="px-6 sticky bottom-0 bg-background border-t py-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
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
