import PageMetaData from "@/components/page-metadata";
import SingleEnrol from "@/components/private/enroll/Single-Enrol";
import { STUDENT_PROFILE_TITLE_DESCRIPTION } from "@/data";
import { useParams } from "react-router";

function SingleEnroll() {
  const { title, description } = STUDENT_PROFILE_TITLE_DESCRIPTION;
  const params = useParams();

  if (!params.id) {
    return <h1>Student number is not defined!</h1>;
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
        <SingleEnrol />
      </div>
    </>
  );
}

export default SingleEnroll;
