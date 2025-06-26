import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import NotFound from "../not-found";

function StudentPhoto() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const url = params.get("url");

  if (!url) {
    return <NotFound />;
  }

  const goBack = () => {
    navigate(-1); // Go back one page in history
  };

  return (
    <div className="relative h-screen w-full flex flex-col space-y-4 p-4 md:p-6">
      <Button onClick={goBack} size="sm" className="cursor-pointer w-max">
        <ArrowLeft /> Go back
      </Button>
      <div className="flex-1 overflow-hidden">
        <img src={url} alt="Uploaded preview" className="w-full h-full object-cover rounded-xl border" />
      </div>
    </div>
  );
}

export default StudentPhoto;
