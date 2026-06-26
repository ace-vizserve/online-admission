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
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-auto" />
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">
            Admin
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => logout()} disabled={isPending}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </header>
      <Outlet />
    </div>
  );
}
