import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { supabase } from "@/lib/client";
import type { GuardianInformation as GuardianInformationType } from "@/types";

const GuardianInformation = () => {

  const { id } = useParams();

  const { data, isLoading, error } = useQuery<GuardianInformationType | null>({
    queryKey: ["ay2025_enrolment_applications_guardian", id],
    queryFn: async () => {
      console.log("Fetching student info for id:", id);
      const { data, error } = await supabase
        .from("ay2025_enrolment_applications")
        .select(`
            guardianFirstName,
            guardianMiddleName,
            guardianLastName,
            guardianPreferredName,
            guardianBirthDay,
            guardianReligion,
            guardianNric,
            guardianMobile,
            guardianEmail,
            guardianCompanyName,
            guardianPosition
        `)
        .eq("id", id)
        .single();
      console.log("Supabase result:", { data, error });
      if (error) throw error;
      // Only show UI if there is at least one guardian field present
      const hasGuardian = data && (
        data.guardianFirstName || data.guardianMiddleName || data.guardianLastName || data.guardianPreferredName || data.guardianBirthDay || data.guardianReligion || data.guardianNric || data.guardianMobile || data.guardianEmail || data.guardianCompanyName || data.guardianPosition
      );
      if (!hasGuardian) return null;
      return {
        guardianFirstName: data?.guardianFirstName ?? "",
        guardianMiddleName: data?.guardianMiddleName ?? "",
        guardianLastName: data?.guardianLastName ?? "",
        guardianPreferredName: data?.guardianPreferredName ?? "",
        guardianBirthDay: data?.guardianBirthDay ?? "",
        guardianReligion: data?.guardianReligion ?? "",
        guardianNric: data?.guardianNric ?? "",
        guardianNricNumber: data?.guardianNric ?? "",
        guardianMobile: data?.guardianMobile ?? "",
        guardianMobileNumber: data?.guardianMobile ?? "",
        guardianEmail: data?.guardianEmail ?? "",
        guardianCompanyName: data?.guardianCompanyName ?? "",
        guardianPosition: data?.guardianPosition ?? "",
        guardianCountry: "",
      } as GuardianInformationType;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading guardian information.</div>;
  if (!data) return <div></div>;


  return (
    <div className="mb-4">
      <Card>
        <CardHeader>
          <CardTitle>Guardian's Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2">
                <Label>First Name</Label>
              </div>
              <Input value={data.guardianFirstName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Middle Name</Label>
              </div>
              <Input value={data.guardianMiddleName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Last Name</Label>
              </div>
              <Input value={data.guardianLastName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Preferred Name</Label>
              </div>
              <Input value={data.guardianPreferredName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Date of Birth</Label>
              </div>
              <Input value={data.guardianBirthDay || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Religion</Label>
              </div>
              <Input value={data.guardianReligion || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Country</Label>
              </div>
              <Input value={data.guardianCountry || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>NRIC/FIN</Label>
              </div>
              <Input value={data.guardianNric || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Mobile Phone</Label>
              </div>
              <Input value={data.guardianMobile || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Email Address</Label>
              </div>
              <Input value={data.guardianEmail || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Work Company</Label>
              </div>
              <Input value={data.guardianCompanyName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Work Position</Label>
              </div>
              <Input value={data.guardianPosition || ''} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuardianInformation