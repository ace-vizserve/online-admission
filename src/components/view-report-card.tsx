import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router";
const MARKBOOK_HANDOFF_URL = import.meta.env.VITE_MARKBOOK_HANDOFF_URL ?? "https://hfse-sis.vercel.app/parent/enter";

type Props = {
  /**
   * Optional deep-link. **Leave this undefined in normal usage** — the
   * parent lands on the markbook's "My children" page, which already
   * lists every child linked to their email plus every currently-
   * published report card per child.
   */
  studentId?: string;
  className?: string;
  children?: React.ReactNode;
};

export function ViewReportCardButton() {
  const navigate = useNavigate();

  return (
    <div className="w-full space-y-2">
      <Button
        type="button"
        size="lg"
        onClick={() => navigate("/admission/report-cards")}
        className={cn(
          "group w-full gap-2 py-8 shadow-xl !rounded-xl border-b-4 !font-bold uppercase tracking-wider transition-all duration-150",
          "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white border-emerald-900",
          "hover:brightness-110 hover:-translate-y-0.5 active:border-b-0 active:translate-y-0",
        )}>
        View Report Cards
        <FileText className="size-5 group-hover:scale-110 transition-transform" />
      </Button>
    </div>
  );
}
