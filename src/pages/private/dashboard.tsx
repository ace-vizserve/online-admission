import PageMetaData from "@/components/page-metadata";
import { SectionCards } from "@/components/private/dashboard/section-cards";
import StudentsList from "@/components/private/dashboard/students-list";
import { PARENTS_DASHBOARD_TITLE_DESCRIPTION } from "@/data";
import { useEffect } from "react";

function Dashboard() {
  const { title, description } = PARENTS_DASHBOARD_TITLE_DESCRIPTION;

  useEffect(() => {
    if (!sessionStorage.length) return;
    sessionStorage.clear();
    location.reload();
  }, []);

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="max-w-screen-2xl mx-auto w-full flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
        <SectionCards />
        <StudentsList />
      </div>
    </>
  );
}

export default Dashboard;
