import Logo from "@/components/logo";
import PageMetaData from "@/components/page-metadata";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FORGOT_PASSWORD_TITLE_DESCRIPTION } from "@/data";
import { forgotPasswordSchema, ForgotPasswordSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";

function ForgotPassword() {
  const { title, description } = FORGOT_PASSWORD_TITLE_DESCRIPTION;
  const form = useForm<ForgotPasswordSchema>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordSchema) {
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
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Card className="w-full border-none shadow-none max-w-xl">
          <Logo className="mx-auto" />
          <CardHeader>
            <CardTitle className="text-2xl">Forgot your password?</CardTitle>
            <CardDescription>
              Enter the email address associated with your account and we'll send you a link to reset your password.
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
                            placeholder="Enter your email here"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    Send reset password link
                  </Button>
                </div>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm">
              <Link to={"/login"} className="underline">
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default ForgotPassword;
