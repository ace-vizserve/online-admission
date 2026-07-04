import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  icon: ReactNode;
  /** Extra classes on the icon plate (e.g. `text-blue-600`) — used by `old-family-info.tsx`'s
   * father/mother/guardian sections, not by `single-documents.tsx`'s, so left optional rather than
   * required. */
  color?: string;
};

/** Replaces the identically-declared `SectionHeader` in `single-documents.tsx` and
 * `old-family-info.tsx`. */
export function SectionHeader({ title, icon, color }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 pb-2">
      <div className={cn("p-2 bg-indigo-50 rounded-lg", color)}>{icon}</div>
      <h2 className="font-bold text-lg text-slate-800 tracking-tight">{title}</h2>
    </div>
  );
}
