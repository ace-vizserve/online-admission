import { Outlet } from "react-router";
import { AppSidebar } from "../private/navbar/sidebar";
import { SiteHeader } from "../private/navbar/site-header";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";

function AdmissionLayout() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" collapsible="offcanvas" />
      <SidebarInset>
        <SiteHeader />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AdmissionLayout;
