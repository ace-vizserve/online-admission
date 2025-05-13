import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/client";
import type { MotherInformation as MotherInformationType } from "@/types";

const MotherInformation = () => {
  console.log("StudentInformationComponent mounted");
  const { id } = useParams();

  const { data, isLoading, error } = useQuery<MotherInformationType | null>({
    queryKey: ["ay2025_enrolment_applications_mother", id],
    queryFn: async () => {
      console.log("Fetching student info for id:", id);
      const { data, error } = await supabase
        .from("ay2025_enrolment_applications")
        .select(`
            motherFirstName,
            motherMiddleName,
            motherLastName,
            motherPreferredName,
            motherBirthDay,
            motherReligion,
            motherNric,
            motherMobile,
            motherEmail,
            motherCompanyName,
            motherPosition
        `)
        .eq("id", id)
        .single();
      console.log("Supabase result:", { data, error });
      if (error) throw error;
      return { motherCountry: '', ...data } as MotherInformationType;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading mother information.</div>;
  if (!data) return <div>No mother information found.</div>;

  return (
    <div className="mb-4">
      <Card>
        <CardHeader>
          <CardTitle>Mother's Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2">
                <Label>First Name</Label>
              </div>
              <Input id="motherFirstName" value={data.motherFirstName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Middle Name</Label>
              </div>
              <Input value={data.motherMiddleName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Last Name</Label>
              </div>
              <Input value={data.motherLastName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Preferred Name</Label>
              </div>
              <Input value={data.motherPreferredName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Date of Birth</Label>
              </div>
              <Input value={data.motherBirthDay || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Religion</Label>
              </div>
              <Input value={data.motherReligion || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Country</Label>
              </div>
              <Input value={data.motherCountry || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>NRIC/FIN</Label>
              </div>
              <Input value={data.motherNric || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Mobile Phone</Label>
              </div>
              <Input value={data.motherMobile || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Email Address</Label>
              </div>
              <Input value={data.motherEmail || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Work Company</Label>
              </div>
              <Input value={data.motherCompanyName || ''} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label>Work Position</Label>
              </div>
              <Input value={data.motherPosition || ''} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MotherInformation;
