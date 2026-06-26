import { ADMIN_EMAILS } from "@/config/admin";
import useSession from "@/hooks/use-session";
import { ReactNode } from "react";
import { Navigate } from "react-router";

function AdminGuard({ children }: { children: ReactNode }) {
  const { session } = useSession();

  if (!session) return <Navigate to="/admin/login" />;
  if (!ADMIN_EMAILS.includes(session.user.email ?? "")) return <Navigate to="/admin/login" />;

  return <>{children}</>;
}

export default AdminGuard;
