import logo from "@/assets/hfse-logo.png";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

function Logo({ className }: { className?: string }) {
  return (
    <motion.img
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      className={cn("object-cover h-16 w-max md:h-24", className)}
      src={logo}
      alt="logo"
    />
  );
}

export default Logo;
