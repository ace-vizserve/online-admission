import { getNewStudentDiscounts } from "@/actions/private";
import cdfDetails from "@/assets/cdfdetails.jpg";
import PageMetaData from "@/components/page-metadata";
import AdditionalLearningNeedsComboBox from "@/components/ui/additional-learning-needs-combo-box";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import {
  campusDevelopmentFeePrimary,
  campusDevelopmentFeeSecondary,
  classLevels,
  ENROL_NEW_STUDENT_ENROLLMENT_INFORMATION_TITLE_DESCRIPTION,
  preferredPaymentMethod,
  preferredPaymentScheme,
  PRIMARY_CLASS_LEVELS,
  SECONDARY_SDF_CLASS_LEVELS,
} from "@/data";
import { useDebounce } from "@/hooks/use-debounce";
import { useSaveApplication } from "@/hooks/use-save-application";
import useSession from "@/hooks/use-session";
import { scheduleOptionsForLevel } from "@/lib/schedule-rules";
import { cn } from "@/lib/utils";
import { EnrollmentInformationSchema, enrollmentInformationSchema } from "@/zod-schema";
import { useSelectAcademicYear } from "@/zustand-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { ArrowRight, CircleHelp, FilePen, ImageIcon, Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useBeforeUnload, useNavigate } from "react-router";
import { toast } from "sonner";

const ENRICHMENT_CLASS_LEVELS = ["YoungStarter Little Star", "YoungStarter Junior Star"];

const CAMBRIDGE_YEAR_1_LEVELS = ["HFSE International Education Programme – Year 1 (equivalent to K2)"];
const CAMBRIDGE_YEAR_2_LEVELS = ["HFSE International Education Programme – Year 2 (equivalent to Primary One)"];
const CAMBRIDGE_SECONDARY_LEVELS = [
  "HFSE International Education Programme – Year 8",
  "HFSE International Education Programme – Year 9",
  "HFSE International Education Programme – Year 10",
];
const CAMBRIDGE_YEAR_2_CLASS_TYPES = [
  "Global Class-Cambridge (ENGLISH+FILIPINO)",
  "Global Class-Cambridge (ENGLISH+MANDARIN)",
  "Global Class-Cambridge (ENGLISH+FRENCH)",
];

const GLOBAL_LANGUAGE_LEVELS = ["Primary Two", "Primary Three", "Primary Four", "Primary Five", "Primary Six"];

const STANDARD_CLASS_LEVELS = [
  "Primary One",
  "Primary Two",
  "Primary Three",
  "Primary Four",
  "Primary Five",
  "Primary Six",
  "Secondary One",
  "Secondary Two",
  "Secondary Three",
  "Secondary Four",
];

function EnrollmentInformation() {
  const { session } = useSession();
  const { title, description } = ENROL_NEW_STUDENT_ENROLLMENT_INFORMATION_TITLE_DESCRIPTION;
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const {
    formState,
    setFormState,
    setCompletedTabs,
    setCurrentTab,
    setActiveTab,
    activeTab,
    completedTabs,
    currentTab,
  } = useEnrolNewStudentContext();
  const { isLoading, saveApplication } = useSaveApplication({
    academicYear,
    activeTab,
    completedTabs,
    currentTab,
    formState,
    setFormState,
    type: "hfse-is",
  });
  const navigate = useNavigate();
  const { data: newStudentDiscounts, isPending: isPendingNewStudentDiscounts } = useQuery({
    queryKey: ["new-discounts", session?.user.email],
    queryFn: async () => {
      return await getNewStudentDiscounts(false, academicYear);
    },
    enabled: session != null,
  });

  const [selectedLevel, setSelectedLevel] = useState<string>(formState.enrollmentInfo?.levelApplied ?? "");
  const [isSelectedReferredBySomeone, setIsSelectedReferredBySomeone] = useState<boolean>(
    formState.enrollmentInfo?.discount?.includes("Referred by someone") ?? false,
  );

  const form = useForm<EnrollmentInformationSchema>({
    resolver: zodResolver(enrollmentInformationSchema),
    defaultValues: {
      ...formState.enrollmentInfo,
    },
  });

  const watchedValues = form.watch();
  const debouncedValues = useDebounce(watchedValues, 150);

  useEffect(() => {
    const wasDirty = form.formState.isDirty;

    if (wasDirty) {
      setFormState({
        ...formState,
        enrollmentInfo: {
          ...debouncedValues,
        },
      });
    }

    form.reset(
      { ...debouncedValues },
      {
        keepErrors: true,
      },
    );
  }, [debouncedValues]);

  useEffect(() => {
    if (form.formState.isSubmitSuccessful) {
      (async () => {
        await saveApplication({ willExit: false });

        toast.success("Enrolment information details saved!", {
          description: "Proceeding to the next step...",
        });

        navigate("/enrol-student/new/upload-requirements");
      })();
    }
  }, [form.formState.isSubmitSuccessful]);

  useBeforeUnload((e) => {
    e.preventDefault();
  });

  function onSubmit(values: EnrollmentInformationSchema) {
    if (values.levelApplied.includes("YoungStarter") && values.paymentOption != "Not Applicable") {
      toast.warning("Invalid Student Development Fee!", {
        description: "Kindly select the option 'Not Applicable'.",
      });
      form.setError("paymentOption", { message: "Please select 'Not Applicable'." });
      return;
    }

    if (
      PRIMARY_CLASS_LEVELS.includes(values.levelApplied) &&
      !campusDevelopmentFeePrimary.find((fee) => fee.value === values.paymentOption)
    ) {
      toast.warning("Invalid Student Development Fee!", {
        description: "Kindly select the option the correct Student Development Fee.",
      });
      form.setError("paymentOption", { message: "Please select the correct Student Development Fee." });
      return;
    }

    if (
      SECONDARY_SDF_CLASS_LEVELS.includes(values.levelApplied) &&
      !campusDevelopmentFeeSecondary.find((fee) => fee.value === values.paymentOption)
    ) {
      toast.warning("Invalid Student Development Fee!", {
        description: "Kindly select the option the correct Student Development Fee.",
      });
      form.setError("paymentOption", { message: "Please select the correct Student Development Fee." });
      return;
    }

    const allowedSchedules = scheduleOptionsForLevel(values.levelApplied, values.classType);

    if (allowedSchedules.length > 0 && !allowedSchedules.includes(values.preferredSchedule)) {
      const allowed = allowedSchedules.map((schedule) => `'${schedule}'`).join(" or ");

      toast.warning("Schedule Not Available!", {
        description: `Only ${allowed} is available for the selected grade level and class type.`,
      });
      form.setError("preferredSchedule", { message: "Please select your preferred schedule for the student." });
      return;
    }

    if (CAMBRIDGE_YEAR_2_LEVELS.includes(values.levelApplied) && !CAMBRIDGE_YEAR_2_CLASS_TYPES.includes(values.classType)) {
      toast.warning("Class Type Mismatch!", {
        description: "Please select a 'Global Class-Cambridge' language track for this grade level.",
      });

      form.setError("classType", {
        message: "Please select a 'Global Class-Cambridge' language track.",
      });

      return;
    }

    if (CAMBRIDGE_YEAR_1_LEVELS.includes(values.levelApplied) && values.classType !== "Global Class-Cambridge") {
      toast.warning("Class Type Mismatch!", {
        description: "Only 'Global Class-Cambridge' is available for this grade level.",
      });

      form.setError("classType", {
        message: "Please select 'Global Class-Cambridge'.",
      });

      return;
    }

    if (CAMBRIDGE_SECONDARY_LEVELS.includes(values.levelApplied) && values.classType !== "Global Class (CAMBRIDGE)") {
      toast.warning("Class Type Mismatch!", {
        description: "Only 'Global Class (CAMBRIDGE)' is available for this grade level.",
      });

      form.setError("classType", {
        message: "Please select 'Global Class (CAMBRIDGE)'.",
      });

      return;
    }

    if (
      STANDARD_CLASS_LEVELS.includes(values.levelApplied) &&
      values.classType !== "Standard Class (ENGLISH + FILIPINO)" &&
      !(
        GLOBAL_LANGUAGE_LEVELS.includes(values.levelApplied) &&
        ["GLOBAL (ENGLISH + MANDARIN)", "GLOBAL (ENGLISH + FRENCH)", "GLOBAL (ENGLISH + TAMIL)"].includes(
          values.classType,
        )
      )
    ) {
      toast.warning("Class Type Mismatch!", {
        description: GLOBAL_LANGUAGE_LEVELS.includes(values.levelApplied)
          ? "Please select 'Standard Class (ENGLISH + FILIPINO)' or a GLOBAL language track."
          : "Only 'Standard Class (ENGLISH + FILIPINO)' is available for this grade level.",
      });

      form.setError("classType", {
        message: "Please select a valid class type for this grade level.",
      });

      return;
    }

    if (ENRICHMENT_CLASS_LEVELS.includes(values.levelApplied) && values.classType !== "Enrichment Class") {
      toast.warning("Class Type Mismatch!", {
        description: "Only 'Enrichment Class' is available for this grade level.",
      });
      form.setError("classType", {
        message: "Please select 'Enrichment Class' for this level.",
      });
      return;
    }

    if (!ENRICHMENT_CLASS_LEVELS.includes(values.levelApplied) && values.classType === "Enrichment Class") {
      toast.warning("Class Type Mismatch!", {
        description: "'Enrichment Class' is not available for the selected grade level.",
      });
      form.setError("classType", {
        message: "Please select a valid class type for this grade level.",
      });
      return;
    }

    setFormState({
      ...formState,
      enrollmentInfo: { ...values, isValid: true },
    });

    setCompletedTabs("/enrol-student/new/enrollment-info");
    setCurrentTab("/enrol-student/new/upload-requirements");
    setActiveTab("/enrol-student/new/upload-requirements");
  }

  async function saveForLater() {
    await saveApplication({ willExit: true });
  }

  if (formState.familyInfo?.motherInfo == null) {
    return <Navigate to={"/enrol-student/new/family-info"} />;
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="w-full mx-auto border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-black tracking-tight text-primary text-center">
              Input the necessary enrolment information
            </CardTitle>
          </CardHeader>
          <Alert className="bg-blue-500/10 border-none w-full md:w-max md:max-w-[400px] mx-auto">
            <Info className="h-4 w-4 !text-blue-500" />
            <div className="space-y-1 text-pretty">
              <AlertTitle className="text-xs text-blue-700 font-bold">Important Information</AlertTitle>
              <span className="text-xs text-blue-900">
                Always click the <span className="font-bold">Save details</span> button after applying any changes to
                ensure your updates are recorded.
              </span>
            </div>
          </Alert>
          <CardContent className="px-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, (errors) => {
                  if (Object.keys(errors).length > 0) {
                    setFormState({
                      ...formState,
                      enrollmentInfo: {
                        ...formState.enrollmentInfo!,
                        isValid: false,
                      },
                    });

                    form.setValue("isValid", false);

                    form.trigger();
                  }
                })}
                className="space-y-8 max-w-6xl mx-auto py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 items-start gap-4 lg:gap-6 w-full">
                  <FormField
                    control={form.control}
                    name="levelApplied"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Level</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedLevel(value);
                          }}
                          defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="min-w-0 w-full">
                              <SelectValue placeholder="Select a class level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <ScrollArea className="h-52">
                              {classLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                        <FormDescription>Select the appropriate class level for the student.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="classType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a class type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ENRICHMENT_CLASS_LEVELS.includes(selectedLevel) ? (
                              <SelectItem value="Enrichment Class">Enrichment Class</SelectItem>
                            ) : CAMBRIDGE_YEAR_2_LEVELS.includes(selectedLevel) ? (
                              <>
                                <SelectItem value="Global Class-Cambridge (ENGLISH+FILIPINO)">
                                  Global Class-Cambridge (ENGLISH+FILIPINO)
                                </SelectItem>
                                <SelectItem value="Global Class-Cambridge (ENGLISH+MANDARIN)">
                                  Global Class-Cambridge (ENGLISH+MANDARIN)
                                </SelectItem>
                                <SelectItem value="Global Class-Cambridge (ENGLISH+FRENCH)">
                                  Global Class-Cambridge (ENGLISH+FRENCH)
                                </SelectItem>
                              </>
                            ) : CAMBRIDGE_YEAR_1_LEVELS.includes(selectedLevel) ? (
                              <SelectItem value="Global Class-Cambridge">Global Class-Cambridge</SelectItem>
                            ) : CAMBRIDGE_SECONDARY_LEVELS.includes(selectedLevel) ? (
                              <SelectItem value="Global Class (CAMBRIDGE)">Global Class (CAMBRIDGE)</SelectItem>
                            ) : STANDARD_CLASS_LEVELS.includes(selectedLevel) ? (
                              <>
                                <SelectItem value="Standard Class (ENGLISH + FILIPINO)">
                                  Standard Class (ENGLISH + FILIPINO)
                                </SelectItem>

                                {GLOBAL_LANGUAGE_LEVELS.includes(selectedLevel) && (
                                  <>
                                    <SelectItem value="GLOBAL (ENGLISH + MANDARIN)">
                                      GLOBAL (ENGLISH + MANDARIN)
                                    </SelectItem>

                                    <SelectItem value="GLOBAL (ENGLISH + FRENCH)">
                                      GLOBAL (ENGLISH + FRENCH)
                                    </SelectItem>

                                    <SelectItem value="GLOBAL (ENGLISH + TAMIL)">GLOBAL (ENGLISH + TAMIL)</SelectItem>
                                  </>
                                )}
                              </>
                            ) : (
                              <SelectItem disabled value="None">
                                Select a class level
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          <span className="font-medium text-red-600">Note:</span> Classes will open only if enough
                          students enrol.
                        </FormDescription>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredSchedule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Schedule</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a schedule" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {scheduleOptionsForLevel(selectedLevel, form.watch("classType")).map((schedule) => (
                              <SelectItem key={schedule} value={schedule}>
                                {schedule}
                              </SelectItem>
                            ))}

                            {selectedLevel == "" && (
                              <SelectItem disabled value={"None"}>
                                Select a class level
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>Select your preferred time slot for classes.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 items-start gap-y-4 lg:gap-6 w-full">
                  <AdditionalLearningNeedsComboBox form={form} />

                  <FormField
                    control={form.control}
                    name="availSchoolBus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bus Service</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Yes or No" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Will the student be using the school's bus service?</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
                  <div className="flex flex-col w-full gap-6">
                    <FormField
                      control={form.control}
                      name="availStudentCare"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student Care</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Yes or No" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Will you avail student care service?</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("availStudentCare") === "Yes" && (
                      <FormField
                        control={form.control}
                        name="studentCareProgram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Student Care Program</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a student care program" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Full day">Full-Day Program</SelectItem>
                                <SelectItem value="Daily">Daily Program</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the student care program that suits your child's schedule.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="paymentOption"
                    render={({ field }) => (
                      <FormItem>
                        <div className="relative flex justify-between items-center">
                          <FormLabel>Student Development Fees Payment Option</FormLabel>

                          <CDFDetailsDialog />
                        </div>

                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a payment option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRIMARY_CLASS_LEVELS.includes(form.watch("levelApplied")) ? (
                              campusDevelopmentFeePrimary.map((fee) => (
                                <SelectItem key={fee.value} value={fee.value}>
                                  {fee.label}
                                </SelectItem>
                              ))
                            ) : SECONDARY_SDF_CLASS_LEVELS.includes(form.watch("levelApplied")) ? (
                              campusDevelopmentFeeSecondary.map((fee) => (
                                <SelectItem key={fee.value} value={fee.value}>
                                  {fee.label}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                            )}
                          </SelectContent>
                        </Select>

                        <FormDescription>Select your preferred Student Development Fees Payment Option.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="preferredPaymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Payment Method</FormLabel>

                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a payment option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {preferredPaymentMethod.map((fee) => (
                              <SelectItem key={fee.value} value={fee.value}>
                                {fee.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <FormDescription>Select your preferred payment method.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredPaymentScheme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tuition Fee Preferred Payment Scheme</FormLabel>

                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a payment option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {preferredPaymentScheme.map((fee) => (
                              <SelectItem key={fee.value} value={fee.value}>
                                {fee.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <FormDescription>Select your preferred payment scheme.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="socialMediaConsent"
                  render={({ field }) => (
                    <FormItem>
                      <div
                        className={cn(
                          "max-w-xl mx-auto w-full p-6 rounded-xl border-2 transition-all duration-300",
                          field.value
                            ? "bg-emerald-50/50 border-emerald-200 shadow-sm"
                            : "bg-slate-50 border-slate-100",
                        )}>
                        <label className="flex items-start gap-4 cursor-pointer">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-1 size-5 rounded-md data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                          </FormControl>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <ImageIcon className="size-4 text-emerald-600" />
                              <span className="text-sm font-bold text-slate-800">Social Media Consent</span>
                            </div>
                            <span className="text-sm leading-relaxed text-slate-700">
                              I give consent for <span className="font-bold text-emerald-700">HFSE</span> to use my
                              child's photo/videos on official school social media platforms.
                            </span>
                            <FormDescription className="mt-2 text-xs font-semibold text-amber-700 leading-normal">
                              Note: Photos will never include full names or personal details.
                            </FormDescription>
                          </div>
                        </label>
                      </div>
                      <FormMessage className="text-[10px] font-bold uppercase" />
                    </FormItem>
                  )}
                />

                <div className="max-w-2xl mx-auto space-y-4 bg-secondary p-6 rounded-2xl border border-muted shadow-sm">
                  <FormField
                    control={form.control}
                    name="contractSignatory"
                    render={({ field }) => (
                      <FormItem className="text-white">
                        <Label className="text-xl text-white font-semibold">Parent Contract Signatory</Label>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white text-black w-full">
                              <SelectValue placeholder="Choose a signatory option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {formState.uploadRequirements?.parentGuardianUploadRequirements?.hasFatherInfo && (
                              <SelectItem value={"Father"}>Father</SelectItem>
                            )}
                            <SelectItem value={"Mother"}>Mother</SelectItem>
                          </SelectContent>
                        </Select>

                        <FormDescription className="text-white">
                          Please select who will sign the contract on behalf of the student.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-4">
                    {isPendingNewStudentDiscounts ? (
                      <div className="w-full flex items-center justify-center">
                        <Tailspin size="30" stroke="5" speed="0.9" color="white" />
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <Label className="text-xl text-white font-semibold">Discount Code</Label>
                            <FormControl>
                              <div>
                                <MultiSelect
                                  maxselecteditems={3}
                                  key={0}
                                  variant={"inverted"}
                                  options={newStudentDiscounts?.discountCodes ?? []}
                                  defaultValue={formState.enrollmentInfo?.discount as string[] | undefined}
                                  onValueChange={(value) => {
                                    if (value.includes("Referred by someone")) {
                                      setIsSelectedReferredBySomeone(true);
                                    } else {
                                      form.setValue("referrerName", "");
                                      form.setValue("referrerMobile", "");
                                      setIsSelectedReferredBySomeone(false);
                                    }
                                    field.onChange(value);
                                  }}
                                  placeholder={
                                    newStudentDiscounts?.discountCodes.length
                                      ? "Select discount codes"
                                      : "No discount codes available"
                                  }
                                  maxCount={3}
                                  className="hidden bg-white hover:bg-white lg:block"
                                />

                                <MultiSelect
                                  maxselecteditems={3}
                                  key={1}
                                  variant={"inverted"}
                                  options={newStudentDiscounts?.discountCodes ?? []}
                                  defaultValue={formState.enrollmentInfo?.discount as string[] | undefined}
                                  onValueChange={(value) => {
                                    if (value.includes("Referred by someone")) {
                                      setIsSelectedReferredBySomeone(true);
                                    } else {
                                      form.setValue("referrerName", "");
                                      form.setValue("referrerMobile", "");
                                      setIsSelectedReferredBySomeone(false);
                                    }
                                    field.onChange(value);
                                  }}
                                  placeholder={
                                    newStudentDiscounts?.discountCodes.length
                                      ? "Select discount codes"
                                      : "No discount codes available"
                                  }
                                  maxCount={1}
                                  className="block bg-white hover:bg-white lg:hidden"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {isSelectedReferredBySomeone && (
                    <>
                      <FormField
                        control={form.control}
                        name="referrerName"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-white">Referrer's Name</FormLabel>
                            <FormControl>
                              <Input
                                required
                                className="bg-white w-full"
                                placeholder="Enter your referrer's full name"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-white">Inquire to HFSE for the details.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="referrerMobile"
                        render={({ field }) => (
                          <FormItem className="flex flex-col items-start">
                            <FormLabel className="text-white">Referrer's Mobile</FormLabel>
                            <FormControl className="w-full">
                              <Input className="bg-white" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>

                <br />
                <Separator />
                <br />

                <div className="flex flex-col gap-4 mb-4 max-w-4xl mx-auto">
                  <Button
                    size={"lg"}
                    className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full"
                    type="submit">
                    Save & Proceed to next step
                    <ArrowRight />
                  </Button>

                  <Button
                    className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
                    type="submit">
                    Save & Proceed to next step
                    <ArrowRight />
                  </Button>

                  <Button
                    onClick={async () => await saveForLater()}
                    disabled={isLoading}
                    variant={"secondary"}
                    size={"lg"}
                    className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full"
                    type="button">
                    {isLoading ? "Saving..." : "Save for later & exit"}
                    {isLoading ? <Loader2 className="animate-spin" /> : <FilePen />}
                  </Button>

                  <Button
                    onClick={async () => await saveForLater()}
                    disabled={isLoading}
                    variant={"secondary"}
                    className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
                    type="button">
                    {isLoading ? "Saving..." : "Save for later & exit"}
                    {isLoading ? <Loader2 className="animate-spin" /> : <FilePen />}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function CDFDetailsDialog() {
  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <CircleHelp className="stroke-primary stroke-2 size-4 cursor-pointer" />
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click here to see SDF details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="!max-w-4xl">
        <DialogHeader className="text-start">
          <DialogTitle className="!font-black text-2xl"> Student Development Fees Payment Option</DialogTitle>
          <DialogDescription className="font-semibold">
            Kindly choose your preferred payment option below.
          </DialogDescription>
        </DialogHeader>
        <img src={cdfDetails} alt="CDF Details" className="object-cover aspect-video rounded-lg" />
      </DialogContent>
    </Dialog>
  );
}

export default EnrollmentInformation;
