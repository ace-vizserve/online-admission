import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type MaxWidthWrapperProps = {
  children: ReactNode;
  className?: string;
};

function MaxWidthWrapper({ children, className }: MaxWidthWrapperProps) {
  return <div className={cn("max-w-7xl mx-auto px-6 md:px-8", className)}>{children}</div>;
}

export default MaxWidthWrapper;
