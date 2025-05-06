import useSession from "@/hooks/use-session";
import { ReactNode } from "react";
import { Navigate } from "react-router";

function AuthGuard({ children }: { children: ReactNode }) {
  const { session } = useSession();

  if (!session) {
    return <Navigate to={"/login"} />;
  }

  return <>{children}</>;
}

export default AuthGuard;
