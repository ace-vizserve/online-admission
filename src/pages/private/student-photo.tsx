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
    <div className="relative h-screen w-full flex items-center justify-center">
      <Button onClick={goBack} size={"sm"} className="cursor-pointer top-6 left-6 gap-2 absolute">
        <ArrowLeft /> Go back
      </Button>
      <img src={url} className="w-max h-max aspect-square object-cover rounded-md" />
    </div>
  );
}

export default StudentPhoto;
