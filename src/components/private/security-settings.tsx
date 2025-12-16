import { updatePassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import useSession from "@/hooks/use-session";
import { updatePasswordSchema, UpdatePasswordSchema } from "@/zod-schema";
import { useSecuritySettingsSheetStore } from "@/zustand-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { ShieldAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { useMediaQuery } from "react-responsive";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { PasswordInput } from "../ui/password-input";

function SecuritySettings() {
  const { session } = useSession();
  const isOpen = useSecuritySettingsSheetStore((state) => state.isOpen);
  const setIsOpen = useSecuritySettingsSheetStore((state) => state.setIsOpen);

  const { mutate, isPending } = useMutation({
    mutationFn: updatePassword,
    onSuccess() {
      form.setValue("password", "");
    },
  });

  const form = useForm<UpdatePasswordSchema>({
    defaultValues: {
      password: "",
    },
    resolver: zodResolver(updatePasswordSchema),
  });

  const passwordChanged = session?.user.user_metadata?.password_changed as boolean | undefined;

  function onSubmit(values: UpdatePasswordSchema) {
    mutate(values);
  }

  const isDesktop = useMediaQuery({
    query: "(min-width: 786px)",
  });

  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="text-xl">Security Settings</SheetTitle>
            <SheetDescription>Update your account password to keep your account secure.</SheetDescription>
          </SheetHeader>
          {passwordChanged != null && !passwordChanged ? (
            <div className="px-4">
              <Alert className="bg-emerald-500/10 border-cyan-600/50 text-cyan-600 dark:border-cyan-600 [&>svg]:text-cyan-600">
                <ShieldAlert />
                <AlertTitle>You're using a temporary password.</AlertTitle>
                <AlertDescription>Please update it to keep your account secure.</AlertDescription>
              </Alert>
            </div>
          ) : null}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-4">
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

                <Button size={"lg"} disabled={isPending} type="submit" className="w-full gap-2">
                  {isPending ? (
                    <>
                      Updating
                      <DotPulse size="30" speed="1.3" color="white" />
                    </>
                  ) : (
                    "Change password"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DrawerContent className="space-y-2">
        <DrawerHeader className="gap-2">
          <DrawerTitle className="text-xl">Security Settings</DrawerTitle>
          <DrawerDescription>Update your account password to keep your account secure.</DrawerDescription>
          {passwordChanged != null && !passwordChanged ? (
            <Alert className="bg-emerald-500/10 border-cyan-600/50 text-cyan-600 dark:border-cyan-600 [&>svg]:text-cyan-600">
              <ShieldAlert />
              <AlertTitle>You're using a temporary password.</AlertTitle>
              <AlertDescription>Please update it to keep your account secure.</AlertDescription>
            </Alert>
          ) : null}
        </DrawerHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-4">
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

              <Button size={"lg"} disabled={isPending} type="submit" className="w-full gap-2">
                {isPending ? (
                  <>
                    Updating
                    <DotPulse size="30" speed="1.3" color="white" />
                  </>
                ) : (
                  "Change password"
                )}
              </Button>
            </div>
          </form>
        </Form>

        <DrawerFooter />
      </DrawerContent>
    </Drawer>
  );
}

export default SecuritySettings;
