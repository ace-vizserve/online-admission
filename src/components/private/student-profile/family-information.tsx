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
    motherMobile,
    motherNationality,
    motherNric,
    motherPreferredName,
    motherReligion,
    motherCompanyName,
    motherPosition,
    fatherEmail,
    fatherBirthDay,
    fatherFirstName,
    fatherLastName,
    fatherMiddleName,
    fatherMobile,
    fatherNationality,
    fatherNric,
    fatherPreferredName,
    fatherReligion,
    fatherCompanyName,
    fatherPosition,
    guardianBirthDay,
    guardianReligion,
    guardianEmail,
    guardianFirstName,
    guardianLastName,
    guardianMiddleName,
    guardianMobile,
    guardianNationality,
    guardianNric,
    guardianPreferredName,
    guardianCompanyName,
    guardianPosition,
  } = familyInformation;

  const siblings = extractSiblings(familyInformation);

  const maskedFatherNric = fatherNric ? fatherNric.slice(0, 3) + "****" + fatherNric.slice(7) : undefined;
  const maskedGuardianNric = guardianNric ? guardianNric.slice(0, 3) + "****" + guardianNric.slice(7) : undefined;
  const maskedMotherNric = motherNric?.slice(0, 3) + "****" + motherNric?.slice(7);

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
                    readOnly
                    value={fatherFirstName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherMiddleName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherLastName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Name</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherPreferredName ?? "N/A"}
                    svgIcon={<Smile className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherBirthDay ? formatDate(fatherBirthDay, "dd/MM/yyyy") : "N/A"}
                    svgIcon={<Cake className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherReligion ?? "N/A"}
                    svgIcon={<Landmark className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Father's Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherEmail ?? "N/A"}
                    svgIcon={<Mail className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherMobile ?? "N/A"}
                    svgIcon={<Phone className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherNationality ?? "N/A"}
                    svgIcon={<Globe className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Father's Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>NRIC/FIN</Label>
                  <InputWithIcon
                    readOnly
                    value={maskedFatherNric ?? "N/A"}
                    svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherCompanyName ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherPosition ?? "N/A"}
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
                    readOnly
                    value={motherFirstName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <InputWithIcon
                    readOnly
                    value={motherMiddleName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <InputWithIcon
                    readOnly
                    value={motherLastName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Name</Label>
                  <InputWithIcon
                    readOnly
                    value={motherPreferredName ?? "N/A"}
                    svgIcon={<Smile className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <InputWithIcon
                    readOnly
                    value={motherBirthDay ? formatDate(motherBirthDay, "dd/MM/yyyy") : "N/A"}
                    svgIcon={<Cake className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <InputWithIcon
                    readOnly
                    value={motherReligion ?? "N/A"}
                    svgIcon={<Landmark className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Mother’s Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <InputWithIcon
                    readOnly
                    value={motherEmail ?? "N/A"}
                    svgIcon={<Mail className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <InputWithIcon
                    readOnly
                    value={motherMobile ?? "N/A"}
                    svgIcon={<Phone className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <InputWithIcon
                    readOnly
                    value={motherNationality ?? "N/A"}
                    svgIcon={<Globe className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Mother’s Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>NRIC/FIN</Label>
                  <InputWithIcon
                    readOnly
                    value={maskedMotherNric ?? "N/A"}
                    svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <InputWithIcon
                    readOnly
                    value={motherCompanyName ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <InputWithIcon
                    readOnly
                    value={motherPosition ?? "N/A"}
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
                    readOnly
                    value={guardianFirstName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <InputWithIcon
                    readOnly
                    value={guardianMiddleName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <InputWithIcon
                    readOnly
                    value={guardianLastName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Name</Label>
                  <InputWithIcon
                    readOnly
                    value={guardianPreferredName ?? "N/A"}
                    svgIcon={<Smile className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <InputWithIcon
                    readOnly
                    value={guardianBirthDay ? formatDate(guardianBirthDay, "dd/MM/yyyy") : "N/A"}
                    svgIcon={<Cake className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <InputWithIcon
                    readOnly
                    value={guardianReligion ?? "N/A"}
                    svgIcon={<Landmark className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Guardian's Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <InputWithIcon
                    readOnly
                    value={guardianEmail ?? "N/A"}
                    svgIcon={<Mail className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <InputWithIcon
                    readOnly
                    value={guardianMobile ?? "N/A"}
                    svgIcon={<Phone className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <InputWithIcon
                    readOnly
                    value={guardianNationality ?? "N/A"}
                    svgIcon={<Globe className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Guardian's Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>NRIC/FIN</Label>
                  <InputWithIcon
                    readOnly
                    value={maskedGuardianNric ?? "N/A"}
                    svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <InputWithIcon
                    readOnly
                    value={guardianCompanyName ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <InputWithIcon
                    readOnly
                    value={guardianPosition ?? "N/A"}
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
                        value={
                          sibling.siblingBirthDay ? formatDate(sibling.siblingBirthDay as string, "dd/MM/yyyy") : "N/A"
                        }
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
