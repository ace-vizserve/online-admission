import { Label } from "@/components/ui/label";
import React from "react";

type DataFieldProps = {
  label: string;
  value?: string | null;
  icon: React.ReactElement<{ className: string }>;
};

/** Replaces the identically-shaped `DataField` component (`single-documents.tsx`) and
 * `renderDataField` local function (`old-family-info.tsx`) — the read-only "view mode" display for
 * a single piece of student/family information. */
export function DataField({ label, value, icon }: DataFieldProps) {
  return (
    <div className="space-y-1.5 group">
      <Label className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">{label}</Label>
      <div className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 bg-white border-slate-200 group-hover:border-slate-300 shadow-sm">
        {React.cloneElement(icon, {
          className: "size-4 text-slate-400 shrink-0 group-hover:text-indigo-500 transition-colors",
        })}

        <span className="text-sm font-bold text-slate-700 truncate capitalize">{value || undefined}</span>
      </div>
    </div>
  );
}
