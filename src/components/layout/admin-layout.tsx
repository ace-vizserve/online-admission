import { userLogout } from "@/actions/auth";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Outlet } from "react-router";

export default function AdminLayout() {
  const { mutate: logout, isPending } = useMutation({ mutationFn: userLogout });

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4 lg:px-6 transition-[width,height] ease-linear">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-auto" />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <span className="text-sm font-bold text-primary tracking-tight">Admin</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout()}
          disabled={isPending}
          className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </header>
      <Outlet />
    </div>
  );
}
