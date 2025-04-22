import { ReactNode } from "react";
import { Navigate } from "react-router";

function UnauthenticatedGuard({ children }: { children: ReactNode }) {
  const user = false;

  if (user) {
    return <Navigate to={"/admission/dashboard"} />;
  }

  return <>{children}</>;
}

export default UnauthenticatedGuard;
