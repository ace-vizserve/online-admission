import useSession from "@/hooks/use-session";
import { ReactNode } from "react";
import { Navigate } from "react-router";

function UnauthenticatedGuard({ children }: { children: ReactNode }) {
  const { session, passwordResetState } = useSession();

  if (session && !passwordResetState) {
    return <Navigate to={"/admission/dashboard"} />;
  }

  return <>{children}</>;
}

export default UnauthenticatedGuard;
