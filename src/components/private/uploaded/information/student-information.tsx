import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/client";
import type { StudentInformation } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

const StudentInformationComponent = () => {
  console.log("StudentInformationComponent mounted");
  const { id } = useParams();

  const { data, isLoading, error } = useQuery<StudentInformation | null>({
    queryKey: ["ay2025_enrolment_applications", id],
    queryFn: async () => {
      console.log("Fetching student info for id:", id);
      const { data, error } = await supabase
        .from("ay2025_enrolment_applications")
        .select(
          `
          id,
          firstName,
          middleName,
          lastName,
          preferredName,
          birthDay,
          gender,
          religion,
          nationality,
          nric,
          homeAddress,
          postalCode,
          homePhone,
          contactPerson,
          contactPersonNumber,
          parentMaritalStatus,
          livingWithWhom,
          enroleePhoto
          `
        )
        .eq("id", id)
        .single();
      console.log("Supabase result:", { data, error });
      if (error) throw error;
      return { country: "", ...data } as StudentInformation;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading student information.</div>;
  if (!data) return <div>No student found.</div>;

  return (
    <div className="mb-4">
      <Card>
        <CardHeader className="flex flex-col items-center space-y-4">
          <CardTitle>Student Information</CardTitle>
          <Avatar className="h-24 w-24">
            <AvatarImage src={data.enroleePhoto || "https://github.com/shadcn.png"} alt="Student Photo" />
            <AvatarFallback>SP</AvatarFallback>
          </Avatar>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2">
                <Label htmlFor="firstName">First Name</Label>
              </div>
              <Input id="firstName" value={data.firstName || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="middleName">Middle Name</Label>
              </div>
              <Input id="middleName" value={data.middleName || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="lastName">Last Name</Label>
              </div>
              <Input id="lastName" value={data.lastName || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="preferredName">Preferred Name</Label>
              </div>
              <Input id="preferredName" value={data.preferredName || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="dob">Date of Birth</Label>
              </div>
              <Input id="dob" value={data.birthDay || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="gender">Gender</Label>
              </div>
              <Input id="gender" value={data.gender || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="religion">Religion</Label>
              </div>
              <Input id="religion" value={data.religion || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="nationality">Nationality</Label>
              </div>
              <Input id="nationality" value={data.nationality || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="nric">NRIC/FIN</Label>
              </div>
              <Input id="nric" value={data.nric?.toString() || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="address">Home Address</Label>
              </div>
              <Input id="address" value={data.homeAddress || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="postalCode">Postal Code</Label>
              </div>
              <Input id="postalCode" value={data.postalCode?.toString() || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="country">Country</Label>
              </div>
              <Input id="country" value={data.country || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="homePhone">Home Phone</Label>
              </div>
              <Input id="homePhone" value={data.homePhone?.toString() || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
              </div>
              <Input id="contactPerson" value={data.contactPerson || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="contactNumber">Contact Person Number</Label>
              </div>
              <Input id="contactNumber" value={data.contactPersonNumber?.toString() || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="maritalStatus">Parent's Marital Status</Label>
              </div>
              <Input id="maritalStatus" value={data.parentMaritalStatus || ""} readOnly />
            </div>
            <div>
              <div className="mb-2">
                <Label htmlFor="livingWith">Living With Whom?</Label>
              </div>
              <Input id="livingWith" value={data.livingWithWhom || ""} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentInformationComponent;
