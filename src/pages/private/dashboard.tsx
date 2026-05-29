import PageMetaData from "@/components/page-metadata";
import { SectionCards } from "@/components/private/dashboard/section-cards";
import StudentsList from "@/components/private/dashboard/students-list";
import { useEffect } from "react";

function Dashboard() {
  useEffect(() => {
    if (!sessionStorage.length) return;
    const enrollmentKeys = Object.keys(sessionStorage).filter((k) =>
      k.includes("enrol") || k.includes("Enrol") || k.includes("FormState") || k.includes("TabState"),
    );
    enrollmentKeys.forEach((k) => sessionStorage.removeItem(k));
  }, []);

  return (
    <>
      <PageMetaData
        title="Dashboard | HFSE International School"
        description="Manage your child's enrollment application."
      />
      <meta name="robots" content="noindex, nofollow" />

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-screen-2xl mx-auto w-full flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
        <SectionCards />
        <StudentsList />
      </div>
    </>
  );
}

export default Dashboard;
