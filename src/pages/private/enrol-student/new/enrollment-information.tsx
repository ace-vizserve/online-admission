import { getNewStudentDiscounts } from "@/actions/private";
import cdfDetails from "@/assets/cdfdetails.jpg";
import PageMetaData from "@/components/page-metadata";
import EnrolNewStudentStepsLoader from "@/components/private/enrol-student/steps/enrol-new-student-steps-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import {
  campusDevelopmentFee,
  classLevels,
  classTypes,
  ENROL_NEW_STUDENT_ENROLLMENT_INFORMATION_TITLE_DESCRIPTION,
} from "@/data";
import { useAutoSave } from "@/hooks/use-autosave";
import { useDebounce } from "@/hooks/use-debounce";
import useSession from "@/hooks/use-session";
import { EnrollmentInformationSchema, enrollmentInformationSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { ArrowRight, CircleHelp } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router";
import { toast } from "sonner";

const MORNING_AFTERNOON_CLASS_LEVEL = [
  "Youngstarters | Little Stars",
  "Youngstarters | Junior Stars",
  "Youngstarters | Senior Stars",
  "Primary One",
  "Primary Two",
  "Primary Three",
  "Primary Four",
  "Primary Five",
  "Primary Six",
];
const WHOLE_DAY_CLASS_LEVEL = ["Secondary One", "Secondary Two", "Secondary Three", "Secondary Four"];

const STANDARD_CLASS_LEVELS = ["Primary Six", "Secondary One", "Secondary Two", "Secondary Three", "Secondary Four"];
const ENRICHMENT_CLASS_LEVELS = [
  "Youngstarters | Little Stars",
  "Youngstarters | Junior Stars",
  "Youngstarters | Senior Stars",
];

function EnrollmentInformation() {
  const { session } = useSession();
  const { title, description } = ENROL_NEW_STUDENT_ENROLLMENT_INFORMATION_TITLE_DESCRIPTION;
  const { formState, setFormState, setCompletedTabs, setCurrentTab, setActiveTab } = useEnrolNewStudentContext();
  const navigate = useNavigate();
  const { data: newStudentDiscounts, isPending: isPendingNewStudentDiscounts } = useQuery({
    queryKey: ["new-discounts", session?.user.email],
    queryFn: getNewStudentDiscounts,
    enabled: session != null,
  });
  const [isPending, setTransition] = useTransition();
  const [selectedLevel, setSelectedLevel] = useState<string>(formState.enrollmentInfo?.levelApplied ?? "");
  const [isSelectedReferredBySomeone, setIsSelectedReferredBySomeone] = useState<boolean>(
    formState.enrollmentInfo?.discount?.includes("Referred by someone") ?? false
  );

  const form = useForm<EnrollmentInformationSchema>({
    resolver: zodResolver(enrollmentInformationSchema),
    defaultValues: {
      ...formState.enrollmentInfo,
      contractSignatory: formState.uploadRequirements?.parentGuardianUploadRequirements.hasFatherInfo
        ? "Father"
        : "Mother",
    },
  });

  useEffect(() => {
    if (form.formState.isSubmitSuccessful) {
      setTransition(() => {
        navigate("/enrol-student/new/upload-requirements");
      });
    }
  }, [form.formState.isSubmitSuccessful, navigate]);

  const debouncedAutoSaveValue = useDebounce(form.watch(), 500);

  useAutoSave(
    setFormState,
    {
      ...formState,
      enrollmentInfo: {
        ...debouncedAutoSaveValue,
      },
    },
    0
  );

  if (formState.familyInfo?.motherInfo == null) {
    return <Navigate to={"/enrol-student/new/family-info"} />;
  }

  function onSubmit(values: EnrollmentInformationSchema) {
    if (WHOLE_DAY_CLASS_LEVEL.includes(values.levelApplied) && values.preferredSchedule !== "Whole Day") {
      toast.warning("Schedule Mismatch!", {
        description: "Only 'Whole Day' schedule is available for the selected grade level.",
      });
      form.setError("preferredSchedule", { message: "Please select your preferred schedule for the student." });
      return;
    }

    if (MORNING_AFTERNOON_CLASS_LEVEL.includes(values.levelApplied) && values.preferredSchedule === "Whole Day") {
      toast.warning("Schedule Not Available!", {
        description: "'Whole Day' is only available for secondary students.",
      });
      form.setError("preferredSchedule", { message: "Please select your preferred schedule for the student." });
      return;
    }

    if (
      STANDARD_CLASS_LEVELS.includes(values.levelApplied) &&
      values.classType !== "Standard Class (ENGLISH + TAGALOG)"
    ) {
      toast.warning("Class Type Mismatch!", {
        description: "Only 'Standard Class (ENGLISH + TAGALOG)' is available for this grade level.",
      });
      form.setError("classType", {
        message: "Please select 'Standard Class (ENGLISH + TAGALOG)' for this level.",
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
      enrollmentInfo: { ...values },
    });
    toast.success("Enrolment information details saved!", {
      description: "Proceeding to the next step...",
    });
    setCompletedTabs("/enrol-student/new/enrollment-info");
    setCurrentTab("/enrol-student/new/upload-requirements");
    setActiveTab("/enrol-student/new/upload-requirements");
  }

  if (isPending) {
    return <EnrolNewStudentStepsLoader />;
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="w-full flex-1">
        <Card className="w-full mx-auto border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-center text-xl lg:text-2xl text-primary">
              Input the necessary enrolment information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-6xl mx-auto py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
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
                            <SelectTrigger className="w-full">
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
                              <SelectItem value={"Enrichment Class"}>Enrichment Class</SelectItem>
                            ) : STANDARD_CLASS_LEVELS.includes(selectedLevel) ? (
                              <SelectItem value={"Standard Class (ENGLISH + TAGALOG)"}>
                                Standard Class (ENGLISH + TAGALOG)
                              </SelectItem>
                            ) : selectedLevel == "" ? (
                              <SelectItem disabled value={"None"}>
                                Select a class level
                              </SelectItem>
                            ) : (
                              classTypes.slice(-4).map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))
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
                            {MORNING_AFTERNOON_CLASS_LEVEL.includes(selectedLevel) && (
                              <>
                                <SelectItem value={"Morning"}>Morning</SelectItem>

                                <SelectItem value={"Afternoon"}>Afternoon</SelectItem>
                              </>
                            )}

                            {WHOLE_DAY_CLASS_LEVEL.includes(selectedLevel) && (
                              <SelectItem value={"Whole Day"}>Whole Day</SelectItem>
                            )}

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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-4 lg:gap-6 w-full">
                  <FormField
                    control={form.control}
                    name="additionalLearningNeeds"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>
                          Additional learning or Special needs{" "}
                          <span className="text-xs text-muted-foreground">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Indicate if the student has any learning needs or special requirements.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
                  <FormField
                    control={form.control}
                    name="availUniform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          School Uniform <span className="text-xs text-muted-foreground">(includes all 3 sets)</span>
                        </FormLabel>
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
                        <FormDescription>Will you avail a school uniform?</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

                  <FormField
                    control={form.control}
                    name="paymentOption"
                    render={({ field }) => (
                      <FormItem>
                        <div className="relative flex justify-between items-center">
                          <FormLabel>Student Development Fees</FormLabel>

                          <CDFDetailsDialog />
                        </div>

                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a payment option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {campusDevelopmentFee.map((fee) => (
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
                </div>

                <div className="max-w-2xl mx-auto space-y-4 bg-secondary p-6 rounded-2xl border border-muted shadow-sm">
                  <FormField
                    control={form.control}
                    name="contractSignatory"
                    render={({ field }) => (
                      <FormItem className="text-white">
                        <FormLabel>Parent Contract Signatory</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white text-black w-full">
                              <SelectValue placeholder="Choose a signatory option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {formState.uploadRequirements?.parentGuardianUploadRequirements.hasFatherInfo && (
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
                    <Label className="text-xl text-white font-semibold">Apply a Discount</Label>
                    {isPendingNewStudentDiscounts ? (
                      <div className="w-full flex items-center justify-center">
                        <Tailspin size="30" stroke="3" speed="0.9" color="white" />
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-white">Discount Code</FormLabel>
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

                <Button
                  size={"lg"}
                  className="hidden lg:flex w-full max-w-3xl mx-auto p-8 gap-2 uppercase"
                  type="submit">
                  Proceed to Next Step
                  <ArrowRight />
                </Button>

                <Button className="flex lg:hidden w-full p-6 gap-2 uppercase" type="submit">
                  Proceed to Next Step
                  <ArrowRight />
                </Button>
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
              <CircleHelp className="stroke-blue-600 stroke-2 size-4" />
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click here to see SDF details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="!max-w-3xl">
        <DialogHeader className="text-start">
          <DialogTitle> Student Development Fees</DialogTitle>
          <DialogDescription>Kindly choose your preferred payment option below.</DialogDescription>
        </DialogHeader>
        <img src={cdfDetails} alt="CDF Details" className="object-cover aspect-video rounded-lg" />
      </DialogContent>
    </Dialog>
  );
}

export default EnrollmentInformation;
