import { ADMIN_EMAILS } from "@/config/admin";
import useSession from "@/hooks/use-session";
import { ReactNode } from "react";
import { Navigate } from "react-router";

function UnauthenticatedGuard({ children }: { children: ReactNode }) {
  const { session, passwordResetState } = useSession();

  if (session && !passwordResetState) {
    if (ADMIN_EMAILS.includes(session.user.email ?? "")) {
      return <Navigate to="/admin/move-student" />;
    }
    return <Navigate to={"/admission/dashboard"} />;
  }

  return <>{children}</>;
}

export default UnauthenticatedGuard;
