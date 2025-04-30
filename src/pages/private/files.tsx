import PageMetaData from "@/components/page-metadata";
import StudentFiles from "@/components/private/documents/student-files";
import { USER_DASHBOARD_TITLE_DESCRIPTION } from "@/data";

export const Files = () => {

  const { title, description } = USER_DASHBOARD_TITLE_DESCRIPTION;

  return (
    <>
    <PageMetaData title={title} description={description} />

    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
      <StudentFiles />
    </div>
  </>
  )
}
