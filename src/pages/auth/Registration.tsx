import students from "@/assets/landing-page/students.png";
import Logo from "@/components/logo";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import { registrationSchema, RegistrationSchema } from "@/zod-schema";
import { Registration as registerUser } from "@/actions/auth";

function Registration() {
  const form = useForm<RegistrationSchema>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      relationship: undefined,
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegistrationSchema) {
    try {
      await registerUser(values);
      toast.success("Registered successfully! Please check your email to confirm your account.");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Failed to submit the form. Please try again.");
    }
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-full h-full grid lg:grid-cols-2">
        <MaxWidthWrapper className="h-full w-full max-w-2xl flex items-center justify-center">
          <Card className="border-none shadow-none w-full max-w-xl">
            <Logo className="mx-auto" />
            <CardHeader>
              <CardTitle className="text-2xl text-center">Parent Portal Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} />
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
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                      {/* Dropdown for Parent/Guardian Role */}
                      <FormField
                      control={form.control}
                      name="relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship to Student</FormLabel>
                          <FormControl>
                            <Select onValueChange={(value) => field.onChange(value)} value={field.value}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mother">Mother</SelectItem>
                                <SelectItem value="father">Father</SelectItem>
                                <SelectItem value="guardian">Guardian</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              autoComplete="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput
                              placeholder="Enter your password"
                              autoComplete="new-password"
                              {...field}
                            />
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
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <PasswordInput
                              placeholder="Re-enter your password"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      Register
                    </Button>
                  </div>
                </form>
              </Form>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link to="#" className="underline">
                  Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </MaxWidthWrapper>
        <div className="bg-muted hidden lg:flex lg:items-center lg:justify-center">
          <img
            src={students}
            alt="HFSE International School Students"
            className="object-cover w-3/4 h-auto rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

export default Registration;
