import { userLogout } from "@/actions/auth";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router";

const ADMIN_NAV = [
  { to: "/admin/move-student", label: "Transfer Records" },
  { to: "/admin/reset-password", label: "Reset Password" },
  { to: "/admin/create-parent", label: "Create Account" },
];

export default function AdminLayout() {
  const { mutate: logout, isPending } = useMutation({ mutationFn: userLogout });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4 lg:px-6 transition-[width,height] ease-linear">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-auto" />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <span className="text-sm font-bold text-primary tracking-tight">Admin</span>
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <nav className="flex items-center gap-1">
            {ADMIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "text-xs font-bold px-2.5 py-1.5 rounded-md transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )
                }>
                {item.label}
              </NavLink>
            ))}
          </nav>
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
