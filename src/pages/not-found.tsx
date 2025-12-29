"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpLeft } from "lucide-react";
import { Link } from "react-router";

function NotFound() {
  return (
    <div className="relative flex items-center justify-center min-h-dvh overflow-hidden bg-slate-50">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] pointer-events-none">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-2xl px-4 text-center space-y-10">
        {/* Large Visual Anchor */}

        <div className="space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-destructive text-[10px] font-bold uppercase tracking-[0.3em] text-white mb-2">
            Error 404
          </div>
          <h1 className="text-4xl font-black tracking-tight text-destructive sm:text-6xl">
            Lost in the <span className="text-slate-400">System?</span>
          </h1>
          <p className="mx-auto max-w-[400px] text-slate-500 font-medium text-base md:text-lg leading-relaxed">
            The page you are looking for has been moved, deleted, or never existed in the first place.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className={cn(
              buttonVariants({ size: "lg", variant: "destructive" }),
              "h-12 px-8 rounded-xl text-white font-bold gap-2 transition-all active:scale-95"
            )}>
            <ArrowUpLeft className="size-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
