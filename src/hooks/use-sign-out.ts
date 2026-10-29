import { userLogout } from "@/actions/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

/**
 * Signs the parent out and forgets everything this tab loaded for them, so the next person to sign
 * in on the same device never sees the previous family's cached data or lands on their last page.
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async () => {
    await userLogout();
    queryClient.clear();
    navigate("/login", { replace: true, state: null });
  };
}
