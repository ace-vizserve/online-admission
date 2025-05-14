import { getStudentEnrollmentInformation } from "@/actions/private";
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
import { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
import {
  campusDevelopmentFee,
  classLevels,
  classTypes,
  ENROL_NEW_STUDENT_ENROLLMENT_INFORMATION_TITLE_DESCRIPTION,
  preferredSchedule,
} from "@/data";
import { getNextGradeLevel } from "@/lib/utils";
import { EnrollmentInformationSchema, enrollmentInformationSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { CircleFadingArrowUpIcon, CircleHelp, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router";
import { toast } from "sonner";

const discountList = [
  { label: "AY250H01EN", value: "AY250H01EN" },
  { label: "AY250H02EN", value: "AY250H02EN" },
  { label: "AY250H03EN", value: "AY250H03EN" },
  { label: "AY250H04EN", value: "AY250H04EN" },
  { label: "AY250H05EN", value: "AY250H05EN" },
];

function OldEnrollmentInformation() {
  const { title, description } = ENROL_NEW_STUDENT_ENROLLMENT_INFORMATION_TITLE_DESCRIPTION;
  const params = useParams();
  const { data, isPending, isSuccess } = useQuery({
    queryKey: ["enrollment-information", params.id],
    queryFn: async () => {
      return await getStudentEnrollmentInformation(params.id!);
    },
  });
  const { formState, setFormState } = useEnrolOldStudentContext();
  const [isShowDiscount, setIsShowDiscount] = useState<boolean>(false);
  const [isShowReferral, setIsShowReferral] = useState<boolean>(false);
  const [discountType, setDiscountType] = useState<string>("");
  const form = useForm<EnrollmentInformationSchema>({
    resolver: zodResolver(enrollmentInformationSchema),
  });

  useEffect(() => {
    if (isSuccess) {
      form.setValue("levelApplied", getNextGradeLevel(data!.levelApplied)!);
    }
  }, [data, form, isSuccess]);

  function onSubmit(values: EnrollmentInformationSchema) {
    setFormState({
      ...formState,
      enrollmentInfo: { ...values, isValid: true },
    });
    toast.success("Enrollment information details saved!", {
      description: "Make sure to double check everything",
    });
  }

  if (isPending) {
    return <Loader />;
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="w-full flex-1">
        <Card className="w-full mx-auto border-none shadow-none">
          <CardHeader className="gap-8 p-0">
            <CardTitle className="text-balance text-center text-2xl text-primary">
              Input the necessary enrollment information
            </CardTitle>
            <Alert className="bg-blue-500/10 border-none w-max mx-auto">
              <CircleFadingArrowUpIcon className="h-4 w-4 !text-blue-500" />
              <div className="space-y-1 text-pretty">
                <AlertTitle className="text-xs text-blue-700 ">Next Grade Auto-Detected</AlertTitle>
                <span className="text-xs text-blue-900 ">
                  Based on previous level{" "}
                  <span className="font-semibold capitalize">
                    {(data!.levelApplied as string).split("-").join(" ")}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold capitalize">
                    {getNextGradeLevel(data!.levelApplied)?.split("-").join(" ")}
                  </span>
                </span>
              </div>
            </Alert>
          </CardHeader>

          <CardContent className="px-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 max-w-6xl mx-auto py-0 md:py-6 lg:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
                  <FormField
                    control={form.control}
                    name="levelApplied"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Level</FormLabel>

                        <Select
                          onValueChange={field.onChange}
                          defaultValue={getNextGradeLevel(data!.levelApplied) ?? field.value}>
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
                              <SelectValue placeholder="Select a class level" />
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
                              <SelectValue placeholder="Select a class level" />
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
                          <Input type="" {...field} />
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
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
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
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
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
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
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
                              <SelectValue placeholder="Select a class level" />
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
                    <Select onValueChange={setDiscountType} value={discountType}>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select a discount option" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-muted shadow-lg rounded-lg">
                        <SelectItem value="referred-by-someone">🎯 Referred by someone</SelectItem>
                        <SelectItem value="discount-code">🏷️ Discount code</SelectItem>
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
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="Select referrer's name" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="referrer-1">Referrer 1</SelectItem>
                                  <SelectItem value="referrer-2">Referrer 2</SelectItem>
                                  <SelectItem value="referrer-3">Referrer 3</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription className="text-white">Inquire to HFSE for the details.</FormDescription>
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
                                    options={discountList}
                                    onValueChange={field.onChange}
                                    placeholder="Select discount codes"
                                    maxCount={3}
                                    className="hidden bg-white hover:bg-white lg:block"
                                  />

                                  <MultiSelect
                                    key={1}
                                    variant={"inverted"}
                                    options={discountList}
                                    onValueChange={field.onChange}
                                    placeholder="Select discount codes"
                                    maxCount={1}
                                    className="block bg-white hover:bg-white lg:hidden"
                                  />
                                </div>
                              </FormControl>
                              <FormDescription className="text-white">Free merchandise / STAR kit.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <div className="w-full flex justify-center items-center">
                          <Button
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
                                  options={discountList}
                                  onValueChange={field.onChange}
                                  placeholder="Select discount codes"
                                  maxCount={3}
                                  className="hidden bg-white hover:bg-white lg:block"
                                />

                                <MultiSelect
                                  key={1}
                                  variant={"inverted"}
                                  options={discountList}
                                  onValueChange={field.onChange}
                                  placeholder="Select discount codes"
                                  maxCount={1}
                                  className="block bg-white hover:bg-white lg:hidden"
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-white">Free merchandise / STAR kit.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {isShowReferral ? (
                        <FormField
                          control={form.control}
                          name="referrerName"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-white">Referrer's Name</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="w-full bg-white">
                                      <SelectValue placeholder="Select referrer's name" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="referrer-1">Referrer 1</SelectItem>
                                    <SelectItem value="referrer-2">Referrer 2</SelectItem>
                                    <SelectItem value="referrer-3">Referrer 3</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormDescription className="text-white">Inquire to HFSE for the details.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <div className="w-full flex justify-center items-center">
                          <Button
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

                <Button size={"lg"} className="hidden lg:flex w-full p-8 gap-2 uppercase" type="submit">
                  Save
                  <Save />
                </Button>

                <Button className="flex lg:hidden w-full p-6 gap-2 uppercase" type="submit">
                  Save
                  <Save />
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
      <DialogTrigger>
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

function Loader() {
  return (
    <div className="h-96 w-full flex flex-col gap-4 items-center justify-center my-7 md:my-14">
      <p className="text-sm text-muted-foreground animate-pulse">Fetching enrolment details...</p>
      <Tailspin size="30" stroke="3" speed="0.9" color="#262E40" />
    </div>
  );
}

export default OldEnrollmentInformation;
