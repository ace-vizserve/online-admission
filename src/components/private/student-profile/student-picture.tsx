import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Camera, Maximize2, User2 } from "lucide-react";
import { Link } from "react-router";

type StudentPictureProps = {
  studentIDPicture?: string;
  enroleeNumber: string;
};

function StudentPicture({ studentIDPicture, enroleeNumber }: StudentPictureProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative group mx-auto size-32 flex items-center justify-center">
          {/* Subtle Outer Ring for "Status" or Depth */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-200 group-hover:border-primary/50 group-hover:rotate-12 transition-all duration-700" />

          <Avatar className="size-28 cursor-pointer ring-4 ring-white shadow-xl transition-transform duration-300 group-hover:scale-105">
            <AvatarImage
              fetchPriority="high"
              alt="Student ID Picture"
              className="object-cover"
              src={studentIDPicture}
            />
            {/* User-friendly Fallback (Initials or School Icon) */}
            <AvatarFallback className="bg-slate-50 text-slate-400">
              <User2 size={40} strokeWidth={1.5} />
            </AvatarFallback>
          </Avatar>

          {/* "View" Overlay Label on Mobile/Hover */}
          <div className="absolute bottom-0 right-0 size-8 bg-white rounded-full border shadow-sm flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
            <Camera size={14} />
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="center"
        className="w-48 p-1 rounded-xl shadow-2xl border-slate-100 overflow-hidden">
        <Link
          to={`/admission/students/${enroleeNumber}/photo?url=${studentIDPicture}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-full justify-start gap-3 px-3 py-5 hover:bg-slate-50 text-slate-600 transition-colors"
          )}>
          <div className="size-7 bg-slate-100 rounded-lg flex items-center justify-center">
            <Maximize2 size={14} className="text-slate-500" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[11px] font-black text-primary uppercase tracking-tight">Full View</span>
            <span className="text-[9px] text-slate-400 font-medium leading-none">Inspect ID Photo</span>
          </div>
        </Link>
      </PopoverContent>
    </Popover>
  );
}

export default StudentPicture;
