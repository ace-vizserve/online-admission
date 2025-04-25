import PageMetaData from "@/components/page-metadata";
import { SectionCards } from "@/components/private/dashboard/section-cards";
import StudentsList from "@/components/private/dashboard/students-list";
import { USER_DASHBOARD_TITLE_DESCRIPTION } from "@/data";

function Dashboard() {
  const { title, description } = USER_DASHBOARD_TITLE_DESCRIPTION;
  return (
    <>
      <PageMetaData title={title} description={description} />

      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
        <SectionCards />
        <StudentsList />
      </div>
    </>
  );
}

export default Dashboard;
