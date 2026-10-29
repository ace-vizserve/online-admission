import useSession from "@/hooks/use-session";
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

/** Signed-out visitors go to login, remembering the page they asked for (see UnauthenticatedGuard). */
function AuthGuard({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to={"/login"} state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <>{children}</>;
}

export default AuthGuard;
