import PageMetaData from "@/components/page-metadata";
import { SectionCards } from "@/components/private/dashboard/section-cards";
import Enroll from "@/components/private/enroll/enrol";
import { ENROLMENT_PAGE_FOR_STUDENT } from "@/data";

export const Enrollment = () => {
  const { title, description } = ENROLMENT_PAGE_FOR_STUDENT;

  return (
    <>
      <PageMetaData title={title} description={description} />

      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
        <SectionCards />
        <Enroll />
      </div>
    </>
  );
};
