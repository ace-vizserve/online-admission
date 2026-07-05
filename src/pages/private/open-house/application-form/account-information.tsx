import PageMetaData from "@/components/page-metadata";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useOpenHouseContext } from "@/context/open-house/open-house-student-context";
import { ENROL_NEW_STUDENT_ENROLLMENT_INFORMATION_TITLE_DESCRIPTION } from "@/data";
import { useDebounce } from "@/hooks/use-debounce";
import { checkEmailExists } from "@/lib/utils";
import { OpenHouseAccountInformationSchema, registrationSchema } from "@/zod-schema";
import { useOpenHouseCredentialsStore } from "@/zustand-store";
import { zodResolver } from "@hookform/resolvers/zod";
import "ldrs/react/Tailspin.css";
import { ArrowRight, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useBeforeUnload, useNavigate } from "react-router";
import { toast } from "sonner";

function AccountInformation() {
  const { title, description } = ENROL_NEW_STUDENT_ENROLLMENT_INFORMATION_TITLE_DESCRIPTION;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { formState, setFormState, setCompletedTabs, setCurrentTab, setActiveTab } = useOpenHouseContext();

  const navigate = useNavigate();

  const { password, confirmPassword, setCredentials } = useOpenHouseCredentialsStore();

  const form = useForm<OpenHouseAccountInformationSchema>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      ...formState.accountInfo,
      password,
      confirmPassword,
    },
  });

  const watchedValues = form.watch();
  const debouncedValues = useDebounce(watchedValues, 150);

  // password/confirmPassword are deliberately kept out of `setFormState` — that store is
  // persisted to sessionStorage in plaintext, which must never hold a password. They're synced
  // to the separate, non-persisted credentials store instead.
  useEffect(() => {
    const wasDirty = form.formState.isDirty;
    const { password, confirmPassword, ...accountInfo } = debouncedValues;

    if (wasDirty) {
      setFormState({
        ...formState,
        accountInfo,
      });
      setCredentials(password, confirmPassword);
    }

    form.reset(
      { ...debouncedValues },
      {
        keepErrors: true,
      },
    );
  }, [debouncedValues]);

  useEffect(() => {
    form.trigger();
  }, []);

  useBeforeUnload((e) => {
    e.preventDefault();
  });

  async function onSubmit(values: OpenHouseAccountInformationSchema) {
    const email = values.email;

    try {
      setIsLoading(true);
      const { exists, emailConfirmed } = await checkEmailExists(email);

      if (exists && emailConfirmed) {
        throw new Error("An account with this email already exists");
      }

      form.setValue("email", email.toLowerCase());

      const { password, confirmPassword, ...accountInfo } = values;

      setFormState({
        ...formState,
        accountInfo: { ...accountInfo, email: email.toLowerCase() },
      });
      setCredentials(password, confirmPassword);

      setCompletedTabs("/open-house/account-info");
      setCurrentTab("/open-house/student-info");
      setActiveTab("/open-house/student-info");

      navigate("/open-house/student-info");

      toast.success("Account information details saved!", {
        description: "Proceeding to the next step...",
      });
    } catch (error) {
      const err = error as Error;
      if (err.message === "An account with this email already exists") {
        form.setError("email", { message: "An account with this email already exists" });
      } else {
        toast.error(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="w-full mx-auto border-none shadow-none">
          <CardHeader className="flex flex-col items-center text-center space-y-4">
            <div className="space-y-2">
              <CardTitle className="text-3xl md:text-4xl font-black tracking-tight text-primary leading-tight">
                Parent Account Setup
              </CardTitle>
              <CardDescription className="font-semibold text-slate-500 max-w-sm mx-auto leading-relaxed">
                Provide your contact details to secure your registration and access the parent portal
              </CardDescription>
            </div>
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
                onSubmit={form.handleSubmit(async (values) => {
                  await onSubmit(values);
                })}
                className="space-y-5 max-w-6xl mx-auto">
                <div className="grid grid-cols-2 items-start gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          First Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Last Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 items-start gap-4">
                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Relationship to Student
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mother">Mother</SelectItem>
                            <SelectItem value="father">Father</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Password
                        </FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Confirm password
                        </FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <br />
                <Separator />
                <br />

                <div className="flex flex-col gap-4 mb-4 max-w-4xl mx-auto">
                  <Button
                    disabled={isLoading}
                    size={"lg"}
                    className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full"
                    type="submit">
                    Save & Proceed to next step
                    <ArrowRight />
                  </Button>

                  <Button
                    disabled={isLoading}
                    className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
                    type="submit">
                    Save & Proceed to next step
                    <ArrowRight />
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

export default AccountInformation;
