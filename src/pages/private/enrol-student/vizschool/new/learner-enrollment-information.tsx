import { getNewStudentDiscounts } from "@/actions/private";
import cdfDetails from "@/assets/cdfdetails.jpg";
import PageMetaData from "@/components/page-metadata";
import { Alert, AlertTitle } from "@/components/ui/alert";
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
import { useEnrolNewLearnerContext } from "@/context/vizschool/enrol-new-learner-context";
import {
  campusDevelopmentFee,
  classTypes,
  ENROL_NEW_STUDENT_ENROLLMENT_INFORMATION_TITLE_DESCRIPTION,
  vizSchoolClassLevels,
} from "@/data";
import { useAutoSave } from "@/hooks/use-autosave";
import { useDebounce } from "@/hooks/use-debounce";
import useSession from "@/hooks/use-session";
import { vizSchoolEnrollmentInformationSchema, VizSchoolEnrollmentInformationSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { CircleHelp, Info, Save } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router";
import { toast } from "sonner";

const STANDARD_CLASS_LEVELS = ["Primary Six", "Secondary One", "Secondary Two", "Secondary Three", "Secondary Four"];

function LearnerEnrollmentInformation() {
  const { session } = useSession();
  const { title, description } = ENROL_NEW_STUDENT_ENROLLMENT_INFORMATION_TITLE_DESCRIPTION;
  const { formState, setFormState, setCompletedTabs, setCurrentTab, setActiveTab } = useEnrolNewLearnerContext();
  const navigate = useNavigate();
  const { data: newStudentDiscounts, isPending: isPendingNewStudentDiscounts } = useQuery({
    queryKey: ["new-discounts", session?.user.email],
    queryFn: async () => {
      return await getNewStudentDiscounts(true);
    },
    enabled: session != null,
  });
  const [isPending, setTransition] = useTransition();
  const [selectedLevel, setSelectedLevel] = useState<string>(formState.enrollmentInfo?.levelApplied ?? "");
  const [isSelectedReferredBySomeone, setIsSelectedReferredBySomeone] = useState<boolean>(
    formState.enrollmentInfo?.discount?.includes("Referred by someone") ?? false
  );

  const form = useForm<VizSchoolEnrollmentInformationSchema>({
    resolver: zodResolver(vizSchoolEnrollmentInformationSchema),
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
        navigate("/vizschool/enrol-student/new/upload-requirements");
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

  function onSubmit(values: VizSchoolEnrollmentInformationSchema) {
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

    setFormState({
      ...formState,
      enrollmentInfo: { ...values },
    });
    toast.success("Enrolment information details saved!", {
      description: "Proceeding to the next step...",
    });
    setCompletedTabs("/vizschool/enrol-student/new/enrollment-info");
    setCurrentTab("/vizschool/enrol-student/new/upload-requirements");
    setActiveTab("/vizschool/enrol-student/new/upload-requirements");
  }

  if (isPending) {
    return <Loader />;
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="w-full mx-auto border-none shadow-none">
          <CardHeader className="p-0">
            <CardTitle className="text-2xl font-black tracking-tight text-secondary text-center">
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
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 max-w-6xl mx-auto py-0 md:py-6 lg:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 items-start gap-4 lg:gap-6 w-full">
                  <FormField
                    control={form.control}
                    name="levelApplied"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Level</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedLevel(value);
                          }}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a class level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <ScrollArea className="h-52">
                              {selectedLevel == "" && (
                                <SelectItem disabled value={"None"}>
                                  Select a class level
                                </SelectItem>
                              )}
                              {vizSchoolClassLevels.map((level) => (
                                <>
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                </>
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
                            {STANDARD_CLASS_LEVELS.includes(selectedLevel) ? (
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
                            <SelectItem value={"Morning"}>Morning</SelectItem>
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
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
                        <FormDescription>Will you avail a school uniform? </FormDescription>
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

                <div className="max-w-2xl mx-auto space-y-4 bg-primary p-6 rounded-2xl border border-muted shadow-sm">
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
                                  placeholder="Select discount codes"
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
                                  placeholder="Select discount codes"
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

                  {(isSelectedReferredBySomeone ||
                    formState.enrollmentInfo?.discount?.includes("Referred by someone")) && (
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
                  variant={"secondary"}
                  size={"lg"}
                  className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full max-w-4xl mx-auto"
                  type="submit">
                  Save details <Save />
                </Button>

                <Button
                  variant={"secondary"}
                  className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
                  type="submit">
                  Save details <Save />
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
          <DialogTitle className="!font-black text-2xl"> Student Development Fees</DialogTitle>
          <DialogDescription className="font-semibold">
            Kindly choose your preferred payment option below.
          </DialogDescription>
        </DialogHeader>
        <img src={cdfDetails} alt="CDF Details" className="object-cover aspect-video rounded-lg" />
      </DialogContent>
    </Dialog>
  );
}

function Loader() {
  return (
    <div className="h-96 w-full flex flex-col gap-4 items-center justify-center my-7 md:my-14">
      <Tailspin size="30" stroke="5" speed="0.9" color="#4F46E5" />
      <p className="text-sm font-bold text-muted-foreground animate-pulse">Fetching enrolment details...</p>
    </div>
  );
}

export default LearnerEnrollmentInformation;
