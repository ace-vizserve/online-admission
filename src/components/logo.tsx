import logo from "@/assets/hfse-logo.png";
import { cn } from "@/lib/utils";

function Logo({ className }: { className?: string }) {
  return <img className={cn("object-cover h-16 w-max md:h-24", className)} src={logo} alt="logo" />;
}

export default Logo;
