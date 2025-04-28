import { CirclePlus, ExternalLink, GraduationCap, UserPlus2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

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

      <Button className="hidden xl:flex order-1 xl:order-last h-max w-full xl:w-1/4 p-0 mt-6" variant={"ghost"}>
        <Card className="w-full max-w-full xl:max-w-[370px] bg-transparent shadow-none">
          <CardHeader className="relative flex flex-col gap-2">
          <Link
          className={cn(
            buttonVariants({ variant: "link", size: "sm" }),
            "hover:no-underline"
          )}
          to="/admission/enrolment/total-enrolled"
          title="View details"
        >

            <div className="w-full flex items-center justify-between ml-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="rounded-md bg-primary p-2 ml-2">
                  <UserPlus2 className="stroke-white size-5" />
                </div>
                <CardDescription>Enrol Student</CardDescription>
              </div>
                <CirclePlus className="size-4 ml-5" />
            </div>
            </Link>
          </CardHeader>
        </Card>
      </Button>
    </div>
  );
}
