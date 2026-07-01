"use client";

import { getDraftRows } from "@/components/private/drafts/draft-ticket";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BookOpenText, ClipboardList, FileText, FilePen, LayoutDashboardIcon } from "lucide-react";
import * as React from "react";
import Logo from "../../logo";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [draftCount, setDraftCount] = React.useState(() => getDraftRows().length);

  React.useEffect(() => {
    const refresh = () => setDraftCount(getDraftRows().length);
    window.addEventListener("draft-list-changed", refresh);
    return () => window.removeEventListener("draft-list-changed", refresh);
  }, []);

  const navGroups = [
    {
      items: [{ title: "Dashboard", url: "/admission/dashboard", icon: LayoutDashboardIcon }],
    },
    {
      label: "Enrolment",
      items: [
        { title: "My Enrolments", url: "/admission/enrolments", icon: ClipboardList },
        { title: "Saved Drafts", url: "/admission/drafts", icon: FilePen, badge: draftCount },
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
