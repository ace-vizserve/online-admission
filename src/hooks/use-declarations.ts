import { listDeclarations } from "@/actions/declarations";
import useSession from "@/hooks/use-session";
import { useQuery } from "@tanstack/react-query";

/**
 * Every absence and travel declaration filed for this parent's children, newest first.
 *
 * Keyed by email like the other account-wide queries. `enabled` matters more here than usual:
 * without a session `sisFetch` rejects for a missing token, which would surface an auth error
 * to someone who is merely signed out.
 */
export function useDeclarations() {
  const { session } = useSession();

  return useQuery({
    queryKey: ["declarations", session?.user.email],
    queryFn: () => listDeclarations(),
    enabled: session != null,
  });
}
