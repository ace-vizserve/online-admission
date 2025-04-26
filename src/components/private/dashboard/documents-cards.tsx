import { CirclePlus, ExternalLink, GraduationCap, PlusCircle, UserPlus2, Users } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router"; // Updated import for React Router v6+

export function DocumentsCards() {
  return (
    <div className="flex flex-col xl:flex-row justify-between gap-4">
      <div className="order-2 flex flex-col lg:flex-row gap-4 w-full">
        {/* Add Student Card */}
        <Card className="w-full max-w-full xl:max-w-[370px]">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="rounded-md bg-primary p-2">
                  <UserPlus2 className="stroke-white size-5" />
                </div>
                <CardDescription className="font-medium">Add Student</CardDescription>
              </div>
              <Link
                to="/admission/add-student"
                className={buttonVariants({ variant: "link", size: "sm" })}
                title="Add Student">
                <CirclePlus className="size-4" />
              </Link>
            </div>
          </CardHeader>
        </Card>

        {/* Enrol Student Card */}
        <Card className="w-full max-w-full xl:max-w-[370px]">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="rounded-md bg-primary p-2">
                  <PlusCircle className="stroke-white size-5" />
                </div>
                <CardDescription className="font-medium">Enrol Student</CardDescription>
              </div>
              <Link
                to="/admission/enrol-student"
                className={buttonVariants({ variant: "link", size: "sm" })}
                title="Enrol Student">
                <ExternalLink className="size-4" />
              </Link>
            </div>
          </CardHeader>
        </Card>

        {/* Total Enrolled Students Card */}
        <Card className="w-full max-w-full xl:max-w-[370px]">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="rounded-md bg-primary p-2">
                  <GraduationCap className="stroke-white size-5" />
                </div>
                <CardDescription className="font-medium">Total Enrolled Students</CardDescription>
              </div>
            </div>
            <CardTitle className="text-4xl font-bold tabular-nums text-primary">6</CardTitle>
          </CardHeader>
        </Card>

        {/* Total Students Card */}
        <Card className="w-full max-w-full xl:max-w-[370px]">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="rounded-md bg-primary p-2">
                  <Users className="stroke-white size-5" />
                </div>
                <CardDescription className="font-medium">Total Students</CardDescription>
              </div>
              <Link
                to="/admission/total-students"
                className={buttonVariants({ variant: "link", size: "sm" })}
                title="View Total Students">
                <ExternalLink className="size-4" />
              </Link>
            </div>
            <CardTitle className="text-4xl font-bold tabular-nums text-primary">6</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Responsive Enrol Student Button */}
      <Button size="lg" className="w-max ml-auto flex xl:hidden gap-2">
        Enrol a Student <PlusCircle />
      </Button>
    </div>
  );
}
