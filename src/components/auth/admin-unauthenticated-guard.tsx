import { ADMIN_EMAILS } from "@/config/admin";
import useSession from "@/hooks/use-session";
import { ReactNode } from "react";
import { Navigate } from "react-router";

function AdminUnauthenticatedGuard({ children }: { children: ReactNode }) {
  const { session } = useSession();

  if (session && ADMIN_EMAILS.includes(session.user.email ?? "")) {
    return <Navigate to="/admin/move-student" />;
  }

  return <>{children}</>;
}

export default AdminUnauthenticatedGuard;
