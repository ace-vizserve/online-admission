import UploadFiles from "@/components/private/uploaded/upload-files";
import { useParams } from "react-router";

function Uploaded() {
  const params = useParams();

  if (!params.id) {
    return <h1>Student number is not defined!</h1>;
  }

  return (
    <>
      <div className="max-w-screen-2xl mx-auto w-full py-7 md:py-14 px-4 md:px-6">
        <UploadFiles enroleeNumber={params.id} />
      </div>
    </>
  );
}

export default Uploaded;
