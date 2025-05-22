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
import { PhoneInput } from "@/components/ui/phone-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import {
  campusDevelopmentFee,
  classLevels,
  classTypes,
  ENROL_NEW_STUDENT_ENROLLMENT_INFORMATION_TITLE_DESCRIPTION,
  preferredSchedule,
} from "@/data";
import { EnrollmentInformationSchema, enrollmentInformationSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { ArrowRight, CircleHelp } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { parsePhoneNumber } from "react-phone-number-input";
import { Navigate, useNavigate } from "react-router";
import { toast } from "sonner";

function EnrollmentInformation() {
  const { title, description } = ENROL_NEW_STUDENT_ENROLLMENT_INFORMATION_TITLE_DESCRIPTION;
  const navigate = useNavigate();
  const { data: newStudentDiscounts, isPending: isPendingNewStudentDiscounts } = useQuery({
    queryKey: ["new-discounts"],
    queryFn: getNewStudentDiscounts,
  });
  const [isPending, setTransition] = useTransition();
  const { formState, setFormState } = useEnrolNewStudentContext();
  const [isShowDiscount, setIsShowDiscount] = useState<boolean>(false);
  const [isShowReferral, setIsShowReferral] = useState<boolean>(false);
  const [discountType, setDiscountType] = useState<string>("");
  const form = useForm<EnrollmentInformationSchema>({
    resolver: zodResolver(enrollmentInformationSchema),
    defaultValues: {
      ...formState.enrollmentInfo,
    },
  });

  useEffect(() => {
    if (form.formState.isSubmitSuccessful) {
      setTransition(() => {
        navigate("/enrol-student/new/upload-requirements");
      });
    }
  }, [form.formState.isSubmitSuccessful, navigate]);

  if (formState.familyInfo?.motherInfo == null) {
    return <Navigate to={"/enrol-student/new/family-info"} />;
  }

  function onSubmit(values: EnrollmentInformationSchema) {
    if ((isShowReferral || discountType === "referred-by-someone") && !values.referrerName) {
      toast.warning("Referrer name is required!", {
        description: "Please provide the name of your referrer or indicate NA/NIL if none.",
      });
      form.setError("referrerName", {
        message: "",
      });
      return;
    }

    setFormState({
      ...formState,
      enrollmentInfo: values,
    });
    toast.success("Enrollment information details saved!", {
      description: "Proceeding to the next step...",
    });
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
              Input the necessary enrollment information
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            {classTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Choose the type of class (e.g., Enrichment Class).</FormDescription>
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
                            {preferredSchedule.map((schedule) => (
                              <SelectItem key={schedule.value} value={schedule.value}>
                                {schedule.label}
                              </SelectItem>
                            ))}
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
                    name="additionalLearningOrSpecialNeeds"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Additional learning or Special needs</FormLabel>
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
                        <FormLabel className="h-9">School Uniform</FormLabel>
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
                        <FormLabel className="h-9">Student Care</FormLabel>
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
                          <FormLabel>Campus Development Fee</FormLabel>

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

                <div className="max-w-2xl mx-auto space-y-4 bg-emerald-400 p-6 rounded-2xl border border-muted shadow-sm">
                  <div className="space-y-4">
                    <Label className="text-xl text-white font-semibold">Apply a Discount</Label>
                    {isPendingNewStudentDiscounts && (
                      <div className="w-full flex items-center justify-center">
                        <Tailspin size="30" stroke="3" speed="0.9" color="white" />
                      </div>
                    )}

                    <Select onValueChange={setDiscountType} value={discountType}>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select a discount option" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-muted shadow-lg rounded-lg">
                        {newStudentDiscounts?.hasReferredBySomeoneDiscounts && (
                          <SelectItem value="referred-by-someone">🎯 Referred by someone</SelectItem>
                        )}
                        {newStudentDiscounts?.hasDiscountCodes && (
                          <SelectItem value="discount-code">🏷️ Discount code</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {discountType === "referred-by-someone" && (
                    <>
                      <FormField
                        control={form.control}
                        name="referrerName"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-white">Referrer's Name</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-white w-full"
                                placeholder="Type NA or NIL if not applicable"
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
                              <PhoneInput
                                {...field}
                                value={parsePhoneNumber(field.value ?? "", "SG")?.formatInternational()}
                                defaultCountry="SG"
                                international
                                className="bg-white rounded-md"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {isShowDiscount ? (
                        <FormField
                          control={form.control}
                          name="discount"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-white">Discount Code</FormLabel>
                              <FormControl>
                                <div>
                                  <MultiSelect
                                    key={0}
                                    variant={"inverted"}
                                    options={newStudentDiscounts?.discountCodes ?? []}
                                    onValueChange={field.onChange}
                                    placeholder="Select discount codes"
                                    maxCount={3}
                                    className="hidden bg-white hover:bg-white lg:block"
                                  />

                                  <MultiSelect
                                    key={1}
                                    variant={"inverted"}
                                    options={newStudentDiscounts?.discountCodes ?? []}
                                    onValueChange={field.onChange}
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
                      ) : (
                        <div className="w-full flex justify-center items-center">
                          <Button
                            disabled={!newStudentDiscounts?.hasDiscountCodes}
                            onClick={() => {
                              setIsShowDiscount(true);
                              setIsShowReferral(false);
                            }}
                            size={"lg"}
                            type="button"
                            className="bg-amber-500 hover:bg-amber-600">
                            Add Discount Code
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {discountType === "discount-code" && (
                    <>
                      <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-white">Discount Code</FormLabel>
                            <FormControl>
                              <div>
                                <MultiSelect
                                  key={0}
                                  variant={"inverted"}
                                  options={newStudentDiscounts?.discountCodes ?? []}
                                  onValueChange={field.onChange}
                                  placeholder="Select discount codes"
                                  maxCount={3}
                                  className="hidden bg-white hover:bg-white lg:block"
                                />

                                <MultiSelect
                                  key={1}
                                  variant={"inverted"}
                                  options={newStudentDiscounts?.discountCodes ?? []}
                                  onValueChange={field.onChange}
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
                      {isShowReferral ? (
                        <>
                          <FormField
                            control={form.control}
                            name="referrerName"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-white">Referrer's Name</FormLabel>
                                <FormControl>
                                  <Input
                                    className="bg-white w-full"
                                    placeholder="Type NA or NIL if not applicable"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription className="text-white">
                                  Inquire to HFSE for the details.
                                </FormDescription>
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
                                  <PhoneInput
                                    {...field}
                                    value={parsePhoneNumber(field.value ?? "", "SG")?.formatInternational()}
                                    defaultCountry="SG"
                                    international
                                    className="bg-white rounded-md"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      ) : (
                        <div className="w-full flex justify-center items-center">
                          <Button
                            disabled={!newStudentDiscounts?.hasReferredBySomeoneDiscounts}
                            onClick={() => {
                              setIsShowDiscount(false);
                              setIsShowReferral(true);
                            }}
                            size={"lg"}
                            type="button"
                            className="bg-amber-500 hover:bg-amber-600">
                            Apply Referral Discount
                          </Button>
                        </div>
                      )}
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
      <DialogTrigger asChild>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size={"icon"} variant={"ghost"} type="button">
                <CircleHelp className="stroke-blue-600 stroke-2" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click here to see CDF details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>
      <DialogContent className="!max-w-3xl">
        <DialogHeader>
          <DialogTitle>Campus Development Fees</DialogTitle>
          <DialogDescription>Kindly choose your preferred payment option below.</DialogDescription>
        </DialogHeader>
        <img src={cdfDetails} alt="CDF Details" className="object-cover aspect-video rounded-lg" />
      </DialogContent>
    </Dialog>
  );
}

export default EnrollmentInformation;
