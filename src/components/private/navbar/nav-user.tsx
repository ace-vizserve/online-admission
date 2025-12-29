"use client";

import { userLogout } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import useSession from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { useSecuritySettingsSheetStore } from "@/zustand-store";
import { ChevronsUpDown, LogOut, Settings, ShieldAlert, User } from "lucide-react";
import { useEffect, useState } from "react";
import SecuritySettings from "../security-settings";

export function NavUser() {
  const { session } = useSession();
  const { isMobile } = useSidebar();
  const setIsOpen = useSecuritySettingsSheetStore((state) => state.setIsOpen);
  const isOpen = useSecuritySettingsSheetStore((state) => state.isOpen);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const passwordChanged = session?.user.user_metadata?.password_changed as boolean;
  const showWarning = !passwordChanged;

  useEffect(() => {
    if (!isOpen) {
      document.body.style.pointerEvents = "";
    }
  }, [isOpen]);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={isDropdownOpen && !isOpen} onOpenChange={(open) => setIsDropdownOpen(open && !isOpen)}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={cn(
                  "border border-transparent transition-all duration-200 py-6 cursor-pointer",
                  "data-[state=open]:bg-white data-[state=open]:border-slate-200 data-[state=open]:shadow-sm"
                )}>
                {/* Avatar Replacement/Icon */}
                <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-white shadow-inner">
                  <User className="size-5" />
                </div>

                <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                  <span className="truncate font-bold text-slate-900 capitalize">
                    {session?.user.user_metadata.fullName}
                  </span>
                  <span className="truncate text-xs text-slate-500 font-medium">{session?.user.email}</span>
                </div>

                <div className="relative flex items-center">
                  {showWarning && (
                    <span className="absolute -left-2 top-1/2 -translate-y-1/2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                    </span>
                  )}
                  <ChevronsUpDown className="ml-auto size-4 text-slate-400" />
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl shadow-xl border-slate-200"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={8}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3 px-1 py-1.5 text-left">
                  <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <User className="size-6" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold text-slate-900 capitalize">
                      {session?.user.user_metadata.fullName}
                    </span>
                    <span className="truncate text-xs text-slate-500">{session?.user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer flex items-center justify-between p-2.5 rounded-lg transition-colors",
                    showWarning ? "bg-red-50 text-red-900 hover:bg-red-100 hover:text-red-900" : "hover:bg-slate-100"
                  )}
                  onClick={() => setIsOpen(true)}>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-1.5 rounded-md",
                        showWarning ? "bg-red-200 text-red-700" : "bg-slate-100 text-slate-500"
                      )}>
                      {showWarning ? <ShieldAlert className="size-4" /> : <Settings className="size-4" />}
                    </div>
                    <span className="font-semibold text-sm">Security Settings</span>
                  </div>
                  {showWarning && (
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-red-600 text-white px-1.5 py-0.5 rounded">
                      Action Required
                    </span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-3 p-2.5 rounded-lg text-slate-600 hover:!text-red-600 hover:!bg-red-50 transition-colors"
                onClick={async () => await userLogout()}>
                <div className="p-1.5 rounded-md !bg-slate-100 group-hover:!bg-red-100">
                  <LogOut className="size-4" />
                </div>
                <span className="font-semibold text-sm">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <SecuritySettings />
    </>
  );
}
