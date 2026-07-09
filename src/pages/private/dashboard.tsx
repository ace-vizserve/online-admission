import PageMetaData from "@/components/page-metadata";
import { SectionCards } from "@/components/private/dashboard/section-cards";
import StudentsList from "@/components/private/dashboard/students-list";
import { safeSessionStorage, safeStorageKeys } from "@/lib/safe-storage";
import { useEffect } from "react";
import { useLocation } from "react-router";

function Dashboard() {
  const location = useLocation();

  useEffect(() => {
    const enrollmentKeys = safeStorageKeys(safeSessionStorage).filter(
      (k) => k.includes("enrol") || k.includes("Enrol") || k.includes("FormState") || k.includes("TabState"),
    );
    enrollmentKeys.forEach((k) => safeSessionStorage.removeItem(k));
  }, []);

  useEffect(() => {
    if (!location.state?.justSaved) return;

    window.history.replaceState({}, "");
    window.location.reload();
  }, [location.state]);

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
