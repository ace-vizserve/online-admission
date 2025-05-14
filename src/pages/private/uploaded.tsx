import UploadFiles from "@/components/private/uploaded/upload-files";
import { useParams } from "react-router";

function UploadedPage() {
  const params = useParams();

  if (!params.id) {
    return <h1>Student number is not defined!</h1>;
  }

  return (
    <>
      <div className="py-7 md:py-14 px-4 md:px-6">
        <UploadFiles studentNumber={params.id} />
      </div>
    </>
  );
}

export default UploadedPage;
