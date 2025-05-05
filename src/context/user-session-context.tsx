import SessionLoader from "@/components/session-loader";
import useSessionListener from "@/hooks/use-session-listener";
import { Session } from "@supabase/supabase-js";
import { createContext, ReactNode } from "react";

type UserSessionContextProps = {
  session: Session | null;
  isLoading: boolean;
};

export const UserSessionContext = createContext<UserSessionContextProps>({ session: null, isLoading: false });

function UserSessionContextProvider({ children }: { children: ReactNode }) {
  const { isLoading, session } = useSessionListener();

  return (
    <UserSessionContext.Provider value={{ isLoading, session }}>
      {isLoading ? <SessionLoader /> : children}
    </UserSessionContext.Provider>
  );
}

export default UserSessionContextProvider;
