import { authUpdatePassword } from "@/actions/auth";
import Logo from "@/components/logo";
import PageMetaData from "@/components/page-metadata";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { FORGOT_PASSWORD_TITLE_DESCRIPTION } from "@/data";
import useSession from "@/hooks/use-session";
import { UpdatePasswordSchema, updatePasswordSchema } from "@/zod-schema";
import { usePasswordResetStore } from "@/zustand-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router";

function UpdatePassword() {
  const { passwordResetState } = useSession();
  const setPasswordResetState = usePasswordResetStore((state) => state.setPasswordResetState);
  const { mutate, isPending } = useMutation({
    mutationFn: authUpdatePassword,
    onSuccess() {
      setPasswordResetState(false);
    },
  });

  const { title, description } = FORGOT_PASSWORD_TITLE_DESCRIPTION;
  const form = useForm<UpdatePasswordSchema>({
    defaultValues: {
      password: "",
    },
    resolver: zodResolver(updatePasswordSchema),
  });

  function onSubmit(values: UpdatePasswordSchema) {
    mutate(values);
  }

  if (!passwordResetState) {
    return <Navigate to={"/admission/dashboard"} replace />;
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Card className="w-full border-none shadow-none max-w-xl">
          <Logo className="mx-auto" />
          <CardHeader>
            <CardTitle className="text-2xl">Update your password</CardTitle>
            <CardDescription>Enter your new password below to complete the reset process.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormLabel id="new-password">New Password</FormLabel>
                        <FormControl>
                          <PasswordInput autoFocus id="new-password" placeholder="Enter your new password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button disabled={isPending} type="submit" className="w-full gap-2">
                    {isPending ? (
                      <>
                        Updating
                        <DotPulse size="30" speed="1.3" color="white" />
                      </>
                    ) : (
                      "Update password"
                    )}
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

export default UpdatePassword;
