"use client";

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { NavLink } from "react-router";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1.5">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <NavLink to={item.url} className="group/menu-item">
                {({ isActive }) => (
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ease-in-out border outline-none",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 ring-1 ring-primary/20"
                        : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900"
                    )}>
                    {item.icon && (
                      <div
                        className={cn(
                          "flex items-center justify-center p-1 rounded-lg transition-colors",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-500 group-hover/menu-item:bg-white"
                        )}>
                        <item.icon className="size-4.5 stroke-[2.5]" />
                      </div>
                    )}
                    <span className={cn("text-sm tracking-tight", isActive ? "font-bold" : "font-semibold")}>
                      {item.title}
                    </span>
                  </div>
                )}
              </NavLink>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
