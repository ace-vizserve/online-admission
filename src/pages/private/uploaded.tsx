import ErrorPage from "@/components/error-page";
import PageMetaData from "@/components/page-metadata";
import UploadFiles from "@/components/private/uploaded/upload-files";
import { STUDENT_PROFILE_TITLE_DESCRIPTION } from "@/data";
import { ErrorBoundary } from "react-error-boundary";
import { useParams } from "react-router";

function Uploaded() {
  const { title, description } = STUDENT_PROFILE_TITLE_DESCRIPTION;
  const params = useParams();

  if (!params.id) {
    return <h1>Enrolee number is not defined!</h1>;
  }

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="max-w-screen-2xl mx-auto w-full py-7 md:py-14 px-4 md:px-6">
        <ErrorBoundary fallback={<ErrorPage />}>
          <UploadFiles enroleeNumber={params.id} />
        </ErrorBoundary>
      </div>
    </>
  );
}

export default Uploaded;
