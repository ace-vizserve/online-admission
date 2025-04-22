import { CirclePlus, ExternalLink, GraduationCap, PlusCircleIcon, UserPlus2, Users } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";

export function SectionCards() {
  return (
    <div className="flex flex-col xl:flex-row justify-between gap-4">
      <div className="order-2 flex flex-col lg:flex-row gap-4 w-full">
        <Card className="w-full max-w-full xl:max-w-[370px]">
          <CardHeader className="relative flex flex-col gap-2">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="rounded-md bg-primary p-2">
                  <Users className="stroke-white size-5" />
                </div>
                <CardDescription>Total Children Enrolled</CardDescription>
              </div>
              <Link
                className={buttonVariants({
                  variant: "link",
                  size: "sm",
                })}
                to="/admission/enrolment/total-enrolled"
                title="View details">
                <ExternalLink className="size-4" />
              </Link>
            </div>
            <CardTitle className="text-4xl font-bold tabular-nums text-primary">6</CardTitle>
          </CardHeader>
        </Card>

        <Card className="w-full max-w-full xl:max-w-[370px]">
          <CardHeader className="relative flex flex-col gap-2">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="rounded-md bg-primary p-2">
                  <GraduationCap className="stroke-white size-5" />
                </div>
                <CardDescription>Current Enrolled Students</CardDescription>
              </div>
              <Link
                className={buttonVariants({
                  variant: "link",
                  size: "sm",
                })}
                to="/admission/enrolment/total-enrolled"
                title="View details">
                <ExternalLink className="size-4" />
              </Link>
            </div>
            <CardTitle className="text-4xl font-bold tabular-nums text-primary">6</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <Button size={"lg"} className="w-max ml-auto flex xl:hidden gap-2">
        Enrol a Student <PlusCircleIcon />{" "}
      </Button>
      <Button className="hidden xl:flex order-1 xl:order-last h-max w-full xl:w-1/4 p-0" variant={"ghost"}>
        <Card className="w-full max-w-full xl:max-w-[370px] bg-transparent shadow-none">
          <CardHeader className="relative flex flex-col gap-2">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="rounded-md bg-primary p-2">
                  <UserPlus2 className="stroke-white size-5" />
                </div>
                <CardDescription>Enrol Student</CardDescription>
              </div>
              <Link
                className={buttonVariants({
                  variant: "link",
                  size: "sm",
                })}
                to="/admission/enrolment/total-enrolled"
                title="View details">
                <CirclePlus className="size-4" />
              </Link>
            </div>
          </CardHeader>
        </Card>
      </Button>
    </div>
  );
}
