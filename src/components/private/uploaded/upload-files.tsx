import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


const UploadFiles = () => {
  return (
    <div>
        {/* Student information */}
        <div className="mb-4">
        <Card>
            <CardHeader className="flex flex-col items-center space-y-4">
                <CardTitle>Student Information</CardTitle>
                <Avatar className="h-24 w-24">
                <AvatarImage src="https://example.com/path-to-student-photo.jpg" alt="Student Photo" />
                <AvatarFallback>SP</AvatarFallback>
                </Avatar>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value="John" readOnly />
                </div>
                <div>
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input id="middleName" value="Doe" readOnly />
                </div>
                <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value="Smith" readOnly />
                </div>
                <div>
                    <Label htmlFor="preferredName">Preferred Name</Label>
                    <Input id="preferredName" value="Johnny" readOnly />
                </div>
                <div>
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" value="2005-04-15" readOnly />
                </div>
                <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Input id="gender" value="Male" readOnly />
                </div>
                <div>
                    <Label htmlFor="religion">Religion</Label>
                    <Input id="religion" value="Christianity" readOnly />
                </div>
                <div>
                    <Label htmlFor="language">Language</Label>
                    <Input id="language" value="English" readOnly />
                </div>
                <div>
                    <Label htmlFor="nric">NRIC/FIN</Label>
                    <Input id="nric" value="S1234567A" readOnly />
                </div>
                <div>
                    <Label htmlFor="address">Home Address</Label>
                    <Input id="address" value="123 Main St, Cabanatuan City" readOnly />
                </div>
                <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input id="postalCode" value="3100" readOnly />
                </div>
                <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value="Philippines" readOnly />
                </div>
                <div>
                    <Label htmlFor="homePhone">Home Phone</Label>
                    <Input id="homePhone" value="09123456789" readOnly />
                </div>
                <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input id="contactPerson" value="Jane Doe" readOnly />
                </div>
                <div>
                    <Label htmlFor="contactNumber">Contact Person Number</Label>
                    <Input id="contactNumber" value="09198765432" readOnly />
                </div>
                <div>
                    <Label htmlFor="maritalStatus">Parent's Marital Status</Label>
                    <Input id="maritalStatus" value="Married" readOnly />
                </div>
                <div>
                    <Label htmlFor="livingWith">Living With Whom</Label>
                    <Input id="livingWith" value="Mother" readOnly />
                </div>
                </div>
            </CardContent>
            </Card>
        </div>

        {/* family information */}
        <div className="mb-4">
            <Card>
                <CardHeader>
                    <CardTitle>Mother's Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>First Name</Label>
                        <Input value="Maria" readOnly />
                    </div>
                    <div>
                        <Label>Middle Name</Label>
                        <Input value="Luisa" readOnly />
                    </div>
                    <div>
                        <Label>Last Name</Label>
                        <Input value="Gonzalez" readOnly />
                    </div>
                    <div>
                        <Label>Preferred Name</Label>
                        <Input value="Mary" readOnly />
                    </div>
                    <div>
                        <Label>Date of Birth</Label>
                        <Input value="1980-03-22" readOnly />
                    </div>
                    <div>
                        <Label>Religion</Label>
                        <Input value="Christianity" readOnly />
                    </div>
                    <div>
                        <Label>Country</Label>
                        <Input value="Philippines" readOnly />
                    </div>
                    <div>
                        <Label>NRIC/FIN</Label>
                        <Input value="S9876543B" readOnly />
                    </div>
                    <div>
                        <Label>Mobile Phone</Label>
                        <Input value="09123456789" readOnly />
                    </div>
                    <div>
                        <Label>Email Address</Label>
                        <Input value="mary.gonzalez@email.com" readOnly />
                    </div>
                    <div>
                        <Label>Work Company</Label>
                        <Input value="ABC Corp" readOnly />
                    </div>
                    <div>
                        <Label>Work Position</Label>
                        <Input value="Manager" readOnly />
                    </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* enrolment information */}
        <div className="mb-4">
            <Card>
                <CardHeader>
                    <CardTitle>Enrollment Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Class Level</Label>
                        <Input value="Primary 1" readOnly />
                    </div>
                    <div>
                        <Label>Class Type</Label>
                        <Input value="Global Class 3 (English + French)" readOnly />
                    </div>
                    <div>
                        <Label>Preferred Schedule</Label>
                        <Input value="Full Time" readOnly />
                    </div>
                    <div>
                        <Label>Additional Learning or Special Needs</Label>
                        <Input value="None" readOnly />
                    </div>
                    <div>
                        <Label>Bus Service</Label>
                        <Input value="Yes" readOnly />
                    </div>
                    <div>
                        <Label>School Uniform</Label>
                        <Input value="Yes" readOnly />
                    </div>
                    <div>
                        <Label>Student Care</Label>
                        <Input value="Yes" readOnly />
                    </div>
                    <div>
                        <Label>Campus Development</Label>
                        <Select value="Option 1" disabled>
                        <SelectTrigger className="w-[527px]">
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Option 1">Option 1</SelectItem>
                            <SelectItem value="Option 2">Option 2</SelectItem>
                            <SelectItem value="Option 3">Option 3</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Apply Discount Code</Label>
                        <Input value="DISCOUNT2025" readOnly />
                    </div>
                    <div>
                        <Label>Referrer's Name</Label>
                        <Input value="Michael Johnson" readOnly />
                    </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* upload files */}
        <Card>
            <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                    <TableCell>Student ID Picture</TableCell>
                    <TableCell>
                        <Button variant="link" size="sm">View</Button>
                    </TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>Birth Certificate</TableCell>
                    <TableCell>
                        <Button variant="link" size="sm">Download</Button>
                    </TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>Transcript of Records</TableCell>
                    <TableCell>
                        <Button variant="link" size="sm">Download</Button>
                    </TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>Form 12</TableCell>
                    <TableCell>
                        <Button variant="link" size="sm">Download</Button>
                    </TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>Medical Examination</TableCell>
                    <TableCell>
                        <Button variant="link" size="sm">Download</Button>
                    </TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>Passport Copy</TableCell>
                    <TableCell>
                        <Button variant="link" size="sm">Download</Button>
                    </TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>Singapore Pass</TableCell>
                    <TableCell>
                        <Button variant="link" size="sm">Download</Button>
                    </TableCell>
                    </TableRow>
                </TableBody>
                </Table>
            </CardContent>
            </Card>
    </div>
  )
}

export default UploadFiles;