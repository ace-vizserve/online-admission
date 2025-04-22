<<<<<<< HEAD
import students from "@/assets/landing-page/students.png";
=======
import students2 from "@/assets/landing-page/students2.png";
>>>>>>> 3952eeb43824ac9e8d4f6021107faa1e767d7f4c
import Logo from "@/components/logo";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
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
import { z } from "zod";
<<<<<<< HEAD
=======

>>>>>>> 3952eeb43824ac9e8d4f6021107faa1e767d7f4c
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";

<<<<<<< HEAD
=======

>>>>>>> 3952eeb43824ac9e8d4f6021107faa1e767d7f4c
const registrationSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type RegistrationSchema = z.infer<typeof registrationSchema>;

function Registration() {
  const form = useForm<RegistrationSchema>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegistrationSchema) {
    try {
      console.log(values);
      toast.success("Registered successfully!");
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-full h-full grid lg:grid-cols-2">
        <MaxWidthWrapper className="h-full w-full max-w-2xl flex items-center justify-center">
          <Card className="border-none shadow-none w-full max-w-xl">
            <Logo className="mx-auto" />
            <CardHeader>
<<<<<<< HEAD
              <CardTitle className="text-2xl text-center">Parent Portal Registration</CardTitle>
=======
              <CardTitle className="text-2xl">Parent Portal Registration</CardTitle>
>>>>>>> 3952eeb43824ac9e8d4f6021107faa1e767d7f4c
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

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
<<<<<<< HEAD
=======

>>>>>>> 3952eeb43824ac9e8d4f6021107faa1e767d7f4c
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              autoComplete="email"
                              {...field}
                            />
<<<<<<< HEAD
=======

>>>>>>> 3952eeb43824ac9e8d4f6021107faa1e767d7f4c
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
<<<<<<< HEAD
=======

>>>>>>> 3952eeb43824ac9e8d4f6021107faa1e767d7f4c
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
<<<<<<< HEAD
            src={students}
=======
            src={students2}
>>>>>>> 3952eeb43824ac9e8d4f6021107faa1e767d7f4c
            alt="HFSE International School Students"
            className="object-cover w-3/4 h-auto rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

export default Registration;
