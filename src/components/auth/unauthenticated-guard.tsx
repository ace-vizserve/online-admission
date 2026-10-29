import { ADMIN_EMAILS } from "@/config/admin";
import useSession from "@/hooks/use-session";
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

/** The portal page AuthGuard sent the visitor away from, if it is one; anything else is ignored. */
function requestedPage(state: unknown): string | null {
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === "string" && from.startsWith("/admission/") ? from : null;
}

function UnauthenticatedGuard({ children }: { children: ReactNode }) {
  const { session, passwordResetState } = useSession();
  const location = useLocation();

  if (session && !passwordResetState) {
    if (ADMIN_EMAILS.includes(session.user.email ?? "")) {
      return <Navigate to="/admin/move-student" />;
    }
    // A shared link (an event's /e/<slug>, say) lands where it pointed rather than on the dashboard.
    const requested = requestedPage(location.state);
    if (requested) return <Navigate to={requested} replace />;
    return <Navigate to={"/admission/dashboard"} />;
  }

  return <>{children}</>;
}

export default UnauthenticatedGuard;
