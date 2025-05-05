import { UserSessionContext } from "@/context/user-session-context";
import { useContext } from "react";

function useSession() {
  const context = useContext(UserSessionContext);

  if (!context) {
    throw new Error("Must be inside the context provider!");
  }

  return context;
}

export default useSession;
