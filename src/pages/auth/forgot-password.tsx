import { sendPasswordResetLink } from "@/actions/auth";
import Logo from "@/components/logo";
import PageMetaData from "@/components/page-metadata";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FORGOT_PASSWORD_TITLE_DESCRIPTION } from "@/data";
import { forgotPasswordSchema, ForgotPasswordSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { useForm } from "react-hook-form";
import { Link } from "react-router";

function ForgotPassword() {
  const { title, description } = FORGOT_PASSWORD_TITLE_DESCRIPTION;
  const form = useForm<ForgotPasswordSchema>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(forgotPasswordSchema),
  });
  const { mutate, isPending } = useMutation({
    mutationFn: sendPasswordResetLink,
    onSuccess() {
      form.reset();
    },
  });

  function onSubmit(values: ForgotPasswordSchema) {
    mutate(values);
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

                  <Button disabled={isPending} type="submit" className="w-full gap-2">
                    {isPending ? (
                      <>
                        Sending
                        <DotPulse size="30" speed="1.3" color="white" />
                      </>
                    ) : (
                      "     Send reset password link"
                    )}
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
