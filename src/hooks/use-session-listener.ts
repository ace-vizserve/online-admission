import { supabase } from "@/lib/client";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const sessionEvents: AuthChangeEvent[] = [
  "INITIAL_SESSION",
  "SIGNED_IN",
  "TOKEN_REFRESHED",
  "SIGNED_OUT",
  "USER_UPDATED",
  "TOKEN_REFRESHED",
];

function useSessionListener() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const authStateListener = supabase.auth.onAuthStateChange((event, userSession) => {
      if (sessionEvents.includes(event)) {
        setSession(userSession);
        setIsLoading(false);
      }
    });

    return () => {
      authStateListener.data.subscription.unsubscribe();
    };
  }, []);

  return { session, isLoading };
}

export default useSessionListener;
