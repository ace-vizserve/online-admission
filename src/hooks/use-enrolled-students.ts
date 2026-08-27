import { listEnrolledStudents } from "@/actions/declarations";
import useSession from "@/hooks/use-session";
import { useQuery } from "@tanstack/react-query";

/**
 * The children the signed-in parent may file a declaration for, straight from the SIS.
 *
 * The SIS decides this list, which is the point: the portal's own enrolment records can drift
 * from the SIS's, and a child offered here that the SIS does not recognise would 403 at submit —
 * after the parent had filled in the whole form.
 */
export function useEnrolledStudents() {
  const { session } = useSession();

  return useQuery({
    queryKey: ["enrolled-students", session?.user.email],
    queryFn: listEnrolledStudents,
    enabled: session != null,
  });
}
