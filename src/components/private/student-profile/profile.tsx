import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { Edit } from "lucide-react";
import StudentFiles from "./student-files";

type ProfileProps = {
  studentID: string;
};

function Profile({ studentID }: ProfileProps) {
  console.log(studentID);

  const props = useSupabaseUpload({
    bucketName: "test",
    path: "test",
    allowedMimeTypes: ["image/*"],
    maxFiles: 2,
    maxFileSize: 1000 * 1000 * 10, // 10MB,
  });

  return (
    <div className="flex flex-col">
      <Card>
        <CardHeader className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <p className="text-xl font-semibold">Alice Johnson</p>
              <p className="text-muted-foreground">Grade 9 Student</p>
            </div>
          </div>
          <Button variant={"outline"} className="gap-2">
            <Edit /> Edit profile
          </Button>
        </CardHeader>
        <CardContent>
          <Dropzone {...props}>
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>

          <StudentFiles />
        </CardContent>
      </Card>
    </div>
  );
}

export default Profile;
