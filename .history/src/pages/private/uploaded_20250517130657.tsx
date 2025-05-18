import SingleDocuments from "@/components/private/documents/single-documents";
import { useParams } from "react-router";

function Uploaded() {
  const params = useParams();

  if (!params.id) {
    return <h1>Student number is not defined!</h1>;
  }

  return (
    <>
      <div className="py-7 md:py-14 px-4 md:px-6">
        <SingleDocuments />
      </div>
    </>
  );
}

export default Uploaded;
