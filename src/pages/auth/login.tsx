import students from "@/assets/landing-page/students.png";
import Logo from "@/components/logo";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import PageMetaData from "@/components/page-metadata";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { LOGIN_PAGE_TITLE_DESCRIPTION } from "@/data";
import { loginSchema, LoginSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";

function Login() {
  const { title, description } = LOGIN_PAGE_TITLE_DESCRIPTION;

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginSchema) {
    try {
      console.log(values);
      toast.success("Success!");
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="h-screen flex items-center justify-center">
        <div className="w-full h-full grid lg:grid-cols-2">
          <MaxWidthWrapper className="h-full w-full max-w-2xl flex items-center justify-center">
            <Card className="border-none shadow-none w-full max-w-xl">
              <Logo className="mx-auto" />
              <CardHeader>
                <CardTitle className="text-2xl">Parent Portal Login</CardTitle>
                <CardDescription>
                  Access your dashboard to manage your child's admission and enrolment requirements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="grid gap-2">
                            <FormLabel htmlFor="email">Email</FormLabel>
                            <FormControl>
                              <Input
                                id="email"
                                placeholder="johndoe@mail.com"
                                type="email"
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
                          <FormItem className="grid gap-2">
                            <div className="flex justify-between items-center">
                              <FormLabel htmlFor="password">Password</FormLabel>
                              <Link to="#" className="ml-auto inline-block text-sm underline">
                                Forgot your password?
                              </Link>
                            </div>
                            <FormControl>
                              <PasswordInput
                                id="password"
                                placeholder="******"
                                autoComplete="current-password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        Login
                      </Button>
                    </div>
                  </form>
                </Form>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link to="#" className="underline">
                    Sign up
                  </Link>
                </div>
              </CardContent>
            </Card>
          </MaxWidthWrapper>
          <div className=" bg-muted hidden lg:flex lg:items-center lg:justify-center">
            <img
              src={students}
              alt="HFSE International School Students"
              className="object-cover w-3/4 h-auto rounded-lg"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
