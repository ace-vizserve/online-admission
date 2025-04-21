import { ArrowUpRight, LogInIcon } from "lucide-react";

import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";

export default function CTABanner() {
  return (
    <MaxWidthWrapper className="py-12 md:py-16 lg:py-20">
      <div className="dark:border relative overflow-hidden w-full dark bg-background text-foreground rounded-2xl py-10 md:py-16 px-6 md:px-14">
        <div className="relative z-0 flex flex-col gap-3">
          <h3 className="text-3xl md:text-4xl font-semibold">Ready to Start Your Child’s Enrollment?</h3>
          <p className="mt-2 text-base md:text-lg text-balance">
            Create a parent account today and begin the HFSE International School admission process with ease.
          </p>
        </div>
        <div className="relative z-0 mt-14 flex flex-col sm:flex-row gap-4">
          <Button size="lg">
            Enroll Now <ArrowUpRight className="!h-5 !w-5" />
          </Button>
          <Button size="lg" variant="outline">
            Sign In <LogInIcon className="!h-5 !w-5" />
          </Button>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
