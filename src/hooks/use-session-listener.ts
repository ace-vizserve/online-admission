import { supabase } from "@/lib/client";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

function useSessionListener() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const authStateListener = supabase.auth.onAuthStateChange((_, userSession) => {
      setSession(userSession);
      setIsLoading(false);
    });

    return () => {
      authStateListener.data.subscription.unsubscribe();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  return { session, isLoading };
}

export default useSessionListener;
