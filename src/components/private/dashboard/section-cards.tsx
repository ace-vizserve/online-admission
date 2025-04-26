import { CirclePlus, ExternalLink, GraduationCap, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";

export function SectionCards() {
  return (
    <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
      <div className="order-2 flex flex-col lg:flex-row gap-4 w-full">
        <Card className="w-full max-w-full xl:max-w-[370px]">
          <CardHeader className="relative flex flex-col gap-2">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="rounded-md bg-primary p-2">
                  <Users className="stroke-white size-5" />
                </div>
                <CardDescription className="font-medium">Total Children Enrolled</CardDescription>
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
                <CardDescription className="font-medium">Enrolled Students</CardDescription>
              </div>

              <Badge className="text-[0.7rem]" variant={"outline"}>
                S.Y. {new Date().getFullYear()} - {new Date().getFullYear() + 1}
              </Badge>
            </div>
            <CardTitle className="text-4xl font-bold tabular-nums text-primary">6</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Link
        to="/enrol-student"
        className={buttonVariants({
          size: "lg",
          className: "w-max ml-auto flex xl:hidden gap-2",
        })}>
        Enrol a Student
        <CirclePlus className="size-4" />
      </Link>

      <Link
        className={buttonVariants({
          size: "lg",
          className: "!hidden xl:!flex gap-2 order-1 xl:order-last h-max w-full xl:w-1/5 p-6",
        })}
        to="/enrol-student">
        Enrol a Student
        <CirclePlus className="size-4" />
      </Link>
    </div>
  );
}
