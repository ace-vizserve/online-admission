import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/client";
import type { FatherInformation as FatherInformationType } from "@/types";


const FatherInformation = () => {
  console.log("StudentInformationComponent mounted");
  const { id } = useParams();

  const { data, isLoading, error } = useQuery<FatherInformationType | null>({
    queryKey: ["ay2025_enrolment_applications_father", id],
    queryFn: async () => {
      console.log("Fetching student info for id:", id);
      const { data, error } = await supabase
        .from("ay2025_enrolment_applications")
        .select(`
            fatherFirstName,
            fatherMiddleName,
            fatherLastName,
            fatherPreferredName,
            fatherBirthDay,
            fatherReligion,
            fatherNric,
            fatherMobile,
            fatherEmail,
            fatherCompanyName,
            fatherPosition
        `)
        .eq("id", id)
        .single();
      console.log("Supabase result:", { data, error });
      if (error) throw error;
      return {
        fatherFirstName: data?.fatherFirstName ?? "",
        fatherMiddleName: data?.fatherMiddleName ?? "",
        fatherLastName: data?.fatherLastName ?? "",
        fatherPreferredName: data?.fatherPreferredName ?? "",
        fatherBirthDay: data?.fatherBirthDay ?? "",
        fatherReligion: data?.fatherReligion ?? "",
        fatherNric: data?.fatherNric ?? "",
        fatherMobile: data?.fatherMobile ?? "",
        fatherEmail: data?.fatherEmail ?? "",
        fatherCompanyName: data?.fatherCompanyName ?? "",
        fatherPosition: data?.fatherPosition ?? "",
        fatherCountry: "",
      } as FatherInformationType;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading father information.</div>;
  if (!data) return <div>No father information found.</div>;

  return (
    <div className="mb-4">
      <Card>
        <CardHeader>
          <CardTitle>Father's Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2">
                <Label>First Name</Label>
              </div>
              <Input value={data.fatherFirstName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Middle Name</Label>
              </div>
              <Input value={data.fatherMiddleName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Last Name</Label>
              </div>
              <Input value={data.fatherLastName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Preferred Name</Label>
              </div>
              <Input value={data.fatherPreferredName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Date of Birth</Label>
              </div>
              <Input value={data.fatherBirthDay || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Religion</Label>
              </div>
              <Input value={data.fatherReligion || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Country</Label>
              </div>
              <Input value={data.fatherCountry || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>NRIC/FIN</Label>
              </div>
              <Input value={data.fatherNric || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Mobile Phone</Label>
              </div>
              <Input value={data.fatherMobile || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Email Address</Label>
              </div>
              <Input value={data.fatherEmail || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Work Company</Label>
              </div>
              <Input value={data.fatherCompanyName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Work Position</Label>
              </div>
              <Input value={data.fatherPosition || ''} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FatherInformation;