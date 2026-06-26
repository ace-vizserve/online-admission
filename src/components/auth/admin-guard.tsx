import useSession from "@/hooks/use-session";
import { ReactNode } from "react";
import { Navigate } from "react-router";

const ADMIN_EMAILS = ["amier.vizbytes@vizserve.hfse.edu.sg", "ace.guevarra@vizserve.hfse.edu.sg"];

function AdminGuard({ children }: { children: ReactNode }) {
  const { session } = useSession();

  if (!session) return <Navigate to="/login" />;
  if (!ADMIN_EMAILS.includes(session.user.email ?? "")) return <Navigate to="/admission/dashboard" />;

  return <>{children}</>;
}

export default AdminGuard;
