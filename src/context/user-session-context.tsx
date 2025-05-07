import SessionLoader from "@/components/session-loader";
import useSessionListener from "@/hooks/use-session-listener";
import { Session } from "@supabase/supabase-js";
import { createContext, ReactNode } from "react";

type UserSessionContextProps = {
  session: Session | null;
  isLoading: boolean;
  passwordResetState: boolean;
};

export const UserSessionContext = createContext<UserSessionContextProps>({
  session: null,
  isLoading: false,
  passwordResetState: false,
});

function UserSessionContextProvider({ children }: { children: ReactNode }) {
  const { isLoading, session, passwordResetState } = useSessionListener();

  return (
    <UserSessionContext.Provider value={{ isLoading, session, passwordResetState }}>
      {isLoading ? <SessionLoader /> : children}
    </UserSessionContext.Provider>
  );
}

export default UserSessionContextProvider;
