"use client";

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { NavLink } from "react-router";

type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: number;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

export function NavMain({ groups }: { groups: NavGroup[] }) {
  return (
    <>
      {groups.map((group, i) => (
        <SidebarGroup key={group.label ?? "__home"} className={cn(i > 0 && "border-t border-border mt-2 pt-4")}>
          {group.label && (
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3 mb-2">
              {group.label}
            </p>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink to={item.url} className="group/menu-item">
                    {({ isActive }) => (
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ease-in-out border outline-none",
                          isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 ring-1 ring-primary/20"
                            : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900",
                        )}>
                        {item.icon && (
                          <div
                            className={cn(
                              "flex items-center justify-center p-1 rounded-lg transition-colors",
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 text-slate-500 group-hover/menu-item:bg-white",
                            )}>
                            <item.icon className="size-4.5 stroke-[2.5]" />
                          </div>
                        )}
                        <span className={cn("text-sm tracking-tight flex-1", isActive ? "font-bold" : "font-semibold")}>
                          {item.title}
                        </span>
                        {item.badge != null && item.badge > 0 && (
                          <span
                            className={cn(
                              "ml-auto min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center bg-red-600 text-white",
                            )}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
