import { updatePassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { updatePasswordSchema, UpdatePasswordSchema } from "@/zod-schema";
import { useSecuritySettingsSheetStore } from "@/zustand-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { useForm } from "react-hook-form";
import { PasswordInput } from "../ui/password-input";

function SecuritySettings() {
  const isOpen = useSecuritySettingsSheetStore((state) => state.isOpen);
  const setIsOpen = useSecuritySettingsSheetStore((state) => state.setIsOpen);

  const { mutate, isPending } = useMutation({
    mutationFn: updatePassword,
  });

  const form = useForm<UpdatePasswordSchema>({
    defaultValues: {
      password: "",
    },
    resolver: zodResolver(updatePasswordSchema),
  });

  function onSubmit(values: UpdatePasswordSchema) {
    mutate(values);
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="text-xl">Security Settings</SheetTitle>
          <SheetDescription>Update your account password to keep your account secure.</SheetDescription>
        </SheetHeader>
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
                    Changing
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

export default SecuritySettings;
