import logo from "@/assets/hfse-logo.webp";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

function Logo({ className }: { className?: string }) {
  return (
    <motion.img
      fetchPriority="high"
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      className={cn("object-cover max-full h-auto max-h-24", className)}
      src={logo}
      alt="logo"
    />
  );
}

export default Logo;
