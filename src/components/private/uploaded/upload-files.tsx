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
                <AvatarImage src="https://github.com/shadcn.png" alt="Student Photo" />
                <AvatarFallback>SP</AvatarFallback>
                </Avatar>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="mb-2">
                        <Label htmlFor="firstName">First Name</Label>
                    </div>
                    <Input id="firstName" value="John" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="middleName">Middle Name</Label>
                    </div>
                    <Input id="middleName" value="Doe" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="lastName">Last Name</Label>
                    </div>
                    <Input id="lastName" value="Smith" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="preferredName">Preferred Name</Label>
                    </div>
                    <Input id="preferredName" value="Johnny" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                    </div>
                    <Input id="dob" value="2005-04-15" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="gender">Gender</Label>
                    </div>
                    <Input id="gender" value="Male" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="religion">Religion</Label>
                    </div>
                    <Input id="religion" value="Christianity" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="language">Language</Label>
                    </div>
                    <Input id="language" value="English" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="nric">NRIC/FIN</Label>
                    </div>
                    <Input id="nric" value="S1234567A" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="address">Home Address</Label>
                    </div>
                    <Input id="address" value="123 Main St, Cabanatuan City" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="postalCode">Postal Code</Label>
                    </div>
                    <Input id="postalCode" value="3100" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="country">Country</Label>
                    </div>
                    <Input id="country" value="Philippines" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="homePhone">Home Phone</Label>
                    </div>
                    <Input id="homePhone" value="09123456789" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="contactPerson">Contact Person</Label>
                    </div>
                    <Input id="contactPerson" value="Jane Doe" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="contactNumber">Contact Person Number</Label>
                    </div>
                    <Input id="contactNumber" value="09198765432" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="maritalStatus">Parent's Marital Status</Label>
                    </div>
                    <Input id="maritalStatus" value="Married" readOnly />
                </div>
                <div>
                    <div className="mb-2">
                        <Label htmlFor="livingWith">Living With Whom?</Label>
                    </div>
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
                        <div className="mb-2">
                            <Label>First Name</Label>
                        </div>
                        <Input value="Maria" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Middle Name</Label>
                        </div>
                        <Input value="Luisa" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Last Name</Label>
                        </div>
                        <Input value="Gonzalez" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Preferred Name</Label>
                        </div>
                        <Input value="Mary" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Date of Birth</Label>
                        </div>
                        <Input value="1980-03-22" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Religion</Label>
                        </div>
                        <Input value="Christianity" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Country</Label>
                        </div>
                        <Input value="Philippines" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>NRIC/FIN</Label>
                        </div>
                        <Input value="S9876543B" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Mobile Phone</Label>
                        </div>
                        <Input value="09123456789" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Email Address</Label>
                        </div>
                        <Input value="mary.gonzalez@email.com" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Work Company</Label>
                        </div>
                        <Input value="ABC Corp" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Work Position</Label>
                        </div>
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
                        <div className="mb-2">
                            <Label>Class Level</Label>
                        </div>
                        <Input value="Primary 1" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Class Type</Label>
                        </div>
                        <Input value="Global Class 3 (English + French)" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Preferred Schedule</Label>
                        </div>
                        <Input value="Full Time" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Additional Learning or Special Needs</Label>
                        </div>
                        <Input value="None" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Bus Service</Label>
                        </div>
                        <Input value="Yes" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>School Uniform</Label>
                        </div>
                        <Input value="Yes" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Student Care</Label>
                        </div>
                        <Input value="Yes" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Campus Development</Label>
                        </div>
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
                        <div className="mb-2">
                            <Label>Apply Discount Code</Label>
                        </div>
                        <Input value="DISCOUNT2025" readOnly />
                    </div>
                    <div>
                        <div className="mb-2">
                            <Label>Referrer's Name</Label>
                        </div>
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
                        <Button className="cursor-pointer" variant="default" size="sm">View</Button>
                    </TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>Birth Certificate</TableCell>
                    <TableCell>
                        <Button className="cursor-pointer" variant="default" size="sm">View</Button>
                    </TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>Transcript of Records</TableCell>
                    <TableCell>
                        <Button className="cursor-pointer" variant="default" size="sm">View</Button>
                    </TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>Form 12</TableCell>
                    <TableCell>
                        <Button className="cursor-pointer" variant="default" size="sm">View</Button>
                    </TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>Medical Examination</TableCell>
                    <TableCell>
                        <Button className="cursor-pointer" variant="default" size="sm">View</Button>
                    </TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>Passport Copy</TableCell>
                    <TableCell>
                        <Button className="cursor-pointer" variant="default" size="sm">View</Button>
                    </TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>Singapore Pass</TableCell>
                    <TableCell>
                        <Button className="cursor-pointer" variant="default" size="sm">View</Button>
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