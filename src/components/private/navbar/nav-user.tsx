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
import { useSecuritySettingsSheetStore } from "@/zustand-store";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import SecuritySettings from "../security-settings";

export function NavUser() {
  const { session } = useSession();
  const { isMobile } = useSidebar();
  const setIsOpen = useSecuritySettingsSheetStore((state) => state.setIsOpen);
  const isOpen = useSecuritySettingsSheetStore((state) => state.isOpen);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const passwordChanged = session?.user.user_metadata?.password_changed as boolean | undefined;

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
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold capitalize">{session?.user.user_metadata.fullName}</span>
                  <span className="truncate text-xs">{session?.user.email}</span>
                </div>
                <div className="relative">
                  {passwordChanged != null && !passwordChanged ? (
                    <span className="animate-pulse -left-1 -top-1 absolute bg-red-600 size-1.5 rounded-full" />
                  ) : null}

                  <ChevronsUpDown className="ml-auto size-4" />
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold capitalize">{session?.user.user_metadata.fullName}</span>
                    <span className="truncate text-xs">{session?.user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer justify-between" onClick={() => setIsOpen(true)}>
                  <div className="flex items-center justify-center gap-2">
                    <Settings />
                    Security Settings
                  </div>
                  {passwordChanged != null && !passwordChanged ? (
                    <span className="bg-red-600 size-2 rounded-full" />
                  ) : null}
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={async () => await userLogout()}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <SecuritySettings />
    </>
  );
}
