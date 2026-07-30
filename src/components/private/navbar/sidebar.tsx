"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useDraftRows } from "@/hooks/use-draft-rows";
import { usePendingTasks } from "@/hooks/use-pending-tasks";
import { BookOpenText, ClipboardList, FileClock, FilePen, FileText, LayoutDashboardIcon } from "lucide-react";
import * as React from "react";
import Logo from "../../logo";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: rows } = useDraftRows();
  const { data: pendingTasksDetails } = usePendingTasks();

  // Children with at least one outstanding document — the same count the dashboard's "Document
  // Requirements" stat card shows. `data` is optional because getSectionCardsDetails swallows
  // its own errors and resolves undefined.
  const pendingTasksCount = pendingTasksDetails?.pendingTasks.pendingTasks.length ?? 0;

  const navGroups = [
    {
      items: [{ title: "Dashboard", url: "/admission/dashboard", icon: LayoutDashboardIcon }],
    },
    {
      label: "Enrolment",
      items: [
        { title: "My Enrolments", url: "/admission/enrolments", icon: ClipboardList },
        { title: "Saved Drafts", url: "/admission/drafts", icon: FilePen, badge: rows?.length ?? 0 },
        {
          title: "Document Requirements",
          url: "/admission/pending-tasks",
          icon: FileClock,
          badge: pendingTasksCount,
        },
      ],
    },
    {
      label: "Resources",
      items: [
        { title: "Report Cards", url: "/admission/report-cards", icon: FileText },
        { title: "Admission Guide", url: "/admission/guidelines", icon: BookOpenText },
      ],
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Logo className="!h-24 mx-auto" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
