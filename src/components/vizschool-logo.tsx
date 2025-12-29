import vizSchoolLogo from "@/assets/vizschool-logo.png";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

function VizSchoolLogo({ className }: { className?: string }) {
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
      src={vizSchoolLogo}
      alt="logo"
    />
  );
}

export default VizSchoolLogo;
