import { Loader2Icon } from "lucide-react";

function EnrolNewStudentStepsLoader() {
  return (
    <div className="h-screen max-h-[300px] w-full max-w-5xl mx-auto flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground animate-pulse">Proceeding to the next step...</p>
        <Loader2Icon className="animate-spin h-10 w-10" />
      </div>
    </div>
  );
}

export default EnrolNewStudentStepsLoader;
