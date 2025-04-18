import { ReactNode } from "react";
import { Navigate } from "react-router";

function AuthGuard({ children }: { children: ReactNode }) {
  const user = true;

  if (!user) {
    return <Navigate to={"/"} />;
  }

  return <>{children}</>;
}

export default AuthGuard;
