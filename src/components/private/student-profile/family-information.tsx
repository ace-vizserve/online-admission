import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { extractSiblings } from "@/lib/utils";
import { FamilyInfo } from "@/types";
import { formatDate } from "date-fns";
import { BadgeInfo, Briefcase, Cake, Globe, Landmark, Mail, Phone, School, Smile, User } from "lucide-react";
import InputWithIcon from "./input-with-icon";

function FamilyInformation({ label, familyInformation }: { label: string; familyInformation: FamilyInfo }) {
  const {
    motherBirthDay,
    motherEmail,
    motherFirstName,
    motherLastName,
    motherMiddleName,
    motherMobilePhone,
    motherNationality,
    motherNric,
    motherPreferredName,
    motherReligion,
    motherWorkCompany,
    motherWorkPosition,
    fatherEmail,
    fatherBirthDay,
    fatherFirstName,
    fatherLastName,
    fatherMiddleName,
    fatherMobilePhone,
    fatherNationality,
    fatherNric,
    fatherPreferredName,
    fatherReligion,
    fatherWorkCompany,
    fatherWorkPosition,
    guardianBirthDay,
    guardianReligion,
    guardianEmail,
    guardianFirstName,
    guardianLastName,
    guardianMiddleName,
    guardianMobilePhone,
    guardianNationality,
    guardianNric,
    guardianPreferredName,
    guardianWorkCompany,
    guardianWorkPosition,
  } = familyInformation;

  const siblings = extractSiblings(familyInformation);

  return (
    <div className="space-y-8 py-6 xl:py-0">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          This section includes details about the student's parents, guardian, and siblings. All fields are read-only.
        </p>
      </div>

      {fatherEmail && (
        <>
          <Separator />
          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Father's Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <InputWithIcon
                    value={fatherFirstName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <InputWithIcon
                    value={fatherMiddleName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <InputWithIcon
                    value={fatherLastName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Name</Label>
                  <InputWithIcon
                    value={fatherPreferredName ?? "N/A"}
                    svgIcon={<Smile className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <InputWithIcon
                    value={fatherBirthDay ? formatDate(fatherBirthDay, "PPP") : "N/A"}
                    svgIcon={<Cake className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <InputWithIcon
                    value={fatherReligion ?? "N/A"}
                    svgIcon={<Landmark className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Father's Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <InputWithIcon
                    value={fatherEmail ?? "N/A"}
                    svgIcon={<Mail className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <InputWithIcon
                    value={fatherMobilePhone ?? "N/A"}
                    svgIcon={<Phone className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <InputWithIcon
                    value={fatherNationality ?? "N/A"}
                    svgIcon={<Globe className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Father's Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>NRIC/FIN</Label>
                  <InputWithIcon
                    value={fatherNric ?? "N/A"}
                    svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <InputWithIcon
                    value={fatherWorkCompany ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <InputWithIcon
                    value={fatherWorkPosition ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {motherEmail && (
        <>
          <Separator />
          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Mother’s Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <InputWithIcon
                    value={motherFirstName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <InputWithIcon
                    value={motherMiddleName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <InputWithIcon
                    value={motherLastName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Name</Label>
                  <InputWithIcon
                    value={motherPreferredName ?? "N/A"}
                    svgIcon={<Smile className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <InputWithIcon
                    value={motherBirthDay ? formatDate(motherBirthDay, "PPP") : "N/A"}
                    svgIcon={<Cake className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <InputWithIcon
                    value={motherReligion ?? "N/A"}
                    svgIcon={<Landmark className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Mother’s Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <InputWithIcon
                    value={motherEmail ?? "N/A"}
                    svgIcon={<Mail className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <InputWithIcon
                    value={motherMobilePhone ?? "N/A"}
                    svgIcon={<Phone className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <InputWithIcon
                    value={motherNationality ?? "N/A"}
                    svgIcon={<Globe className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Mother’s Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>NRIC/FIN</Label>
                  <InputWithIcon
                    value={motherNric ?? "N/A"}
                    svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <InputWithIcon
                    value={motherWorkCompany ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <InputWithIcon
                    value={motherWorkPosition ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {guardianEmail && (
        <>
          <Separator />
          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Guardian's Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <InputWithIcon
                    value={guardianFirstName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <InputWithIcon
                    value={guardianMiddleName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <InputWithIcon
                    value={guardianLastName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Name</Label>
                  <InputWithIcon
                    value={guardianPreferredName ?? "N/A"}
                    svgIcon={<Smile className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <InputWithIcon
                    value={guardianBirthDay ? formatDate(guardianBirthDay, "PPP") : "N/A"}
                    svgIcon={<Cake className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <InputWithIcon
                    value={guardianReligion ?? "N/A"}
                    svgIcon={<Landmark className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Guardian's Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <InputWithIcon
                    value={guardianEmail ?? "N/A"}
                    svgIcon={<Mail className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <InputWithIcon
                    value={guardianMobilePhone ?? "N/A"}
                    svgIcon={<Phone className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <InputWithIcon
                    value={guardianNationality ?? "N/A"}
                    svgIcon={<Globe className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Guardian's Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>NRIC/FIN</Label>
                  <InputWithIcon
                    value={guardianNric ?? "N/A"}
                    svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <InputWithIcon
                    value={guardianWorkCompany ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <InputWithIcon
                    value={guardianWorkPosition ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {siblings != null && siblings.length > 0 && (
        <>
          <Separator />
          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Sibling Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-12 p-0">
              {siblings.map((sibling, index) => (
                <div key={index} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <InputWithIcon
                        value={(sibling.siblingFullName as string) ?? "N/A"}
                        svgIcon={<User className="text-muted-foreground size-4" />}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Birthday</Label>
                      <InputWithIcon
                        value={sibling.siblingBirthDay ? formatDate(sibling.siblingBirthDay as string, "PPP") : "N/A"}
                        svgIcon={<Cake className="text-muted-foreground size-4" />}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Religion</Label>
                      <InputWithIcon
                        value={(sibling.siblingReligion as string) ?? "N/A"}
                        svgIcon={<Landmark className="text-muted-foreground size-4" />}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>School Level / Company Position</Label>
                      <InputWithIcon
                        value={(sibling.siblingEducationOccupation as string) ?? "N/A"}
                        svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>School / Company Name</Label>
                      <InputWithIcon
                        value={(sibling.siblingSchoolCompany as string) ?? "N/A"}
                        svgIcon={<School className="text-muted-foreground size-4" />}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default FamilyInformation;
