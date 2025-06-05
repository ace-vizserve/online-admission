import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Image } from "lucide-react";
import { Link } from "react-router";

type StudentPictureProps = {
  studentIDPicture?: string;
  enroleeNumber: string;
};

function StudentPicture({ studentIDPicture, enroleeNumber }: StudentPictureProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Avatar className="size-28 mx-auto hover:brightness-95 border">
          <AvatarImage
            className="object-cover cursor-pointer"
            src={studentIDPicture ?? "https://github.com/shadcn.png"}
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1">
        <Link
          to={`/admission/students/${enroleeNumber}/photo?url=${studentIDPicture}`}
          className={buttonVariants({
            className: "text-muted-foreground w-full gap-2",
            size: "sm",
            variant: "ghost",
          })}>
          <Image />
          See ID Picture
        </Link>
      </PopoverContent>
    </Popover>
  );
}

export default StudentPicture;
