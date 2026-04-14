import { Button } from "@/components/ui/button";
import useSession from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
const MARKBOOK_HANDOFF_URL =
  import.meta.env.VITE_MARKBOOK_HANDOFF_URL ?? "https://hfse-markbook.vercel.app/parent/enter";

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

export function ViewReportCardButton({ studentId, className, children }: Props) {
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      if (!session) {
        setError("Your session has expired. Please sign in again.");
        setLoading(false);
        return;
      }

      const next = studentId ? `/parent/report-cards/${studentId}` : "/parent";

      const fragment = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        next,
      }).toString();

      window.location.href = `${MARKBOOK_HANDOFF_URL}#${fragment}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to open report card");
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-2">
      <Button
        type="button"
        size="lg"
        onClick={go}
        disabled={loading}
        className={cn(
          "group w-full gap-2 py-8 shadow-xl !rounded-xl border-b-4 !font-bold uppercase tracking-wider transition-all duration-150",
          "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white border-emerald-900",
          "hover:brightness-110 hover:-translate-y-0.5 active:border-b-0 active:translate-y-0",
          className,
        )}>
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Opening report card…
          </>
        ) : (
          (children ?? (
            <>
              View Report Cards
              <FileText className="size-5 group-hover:scale-110 transition-transform" />
            </>
          ))
        )}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive text-center">
          {error}
        </p>
      )}
    </div>
  );
}
