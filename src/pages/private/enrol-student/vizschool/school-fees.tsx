import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSelectSchoolFee } from "@/zustand-store";
import { ArrowUpRight, CircleCheck, Info } from "lucide-react";
import { motion, Variants } from "motion/react";
import { Link } from "react-router";

const schoolFees = [
  {
    programName: "VizIndie",
    overview: "Independent Learning",
    fees: 2500.0,
    promo: 1250.0,
    whoItsFor: "Parents who prefer to fully homeschool their child using their own pace and materials",
    features: [
      "Parent-led learning with HFSE guidance",
      "Customizable curriculum",
      "Quarterly academic review",
      "Homeroom & Family Support",
      "HFSE Cambridge Alignment",
    ],
  },
  {
    programName: "VizFlex",
    overview: "Flexible Learning | Hybrid",
    fees: 3500.0,
    promo: 1750.0,
    whoItsFor: "Independent learners who thrive with structure but need schedule flexibility",
    features: [
      "Blended print/online curriculum (by level)",
      "Asynchronous video learning",
      "Subject advisor support",
      "Access to MobyMax / platforms",
      "Optional workshops",
    ],
  },
  {
    programName: "VizLive",
    overview: "Synchronous Online Learning",
    fees: 5500.0,
    promo: 2750.0,
    whoItsFor: "Students who prefer full online classroom experience with interaction and regular teacher support",
    features: [
      "Daily Zoom-based live classes",
      "HFSE teachers with Singapore-level standards",
      "Subject grading & mentorship",
      "Clubs, assemblies, and community",
      "Includes assessment platforms (e.g. MAP, MobyMax)",
    ],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const SchoolFees = () => {
  const setSchoolFee = useSelectSchoolFee((state) => state.setSchoolFee);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 space-y-12">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-balance">School Fees</h1>
        <p className="text-lg md:text-xl text-muted-foreground text-pretty">
          Choose the plan that fits your needs and get started today
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {schoolFees.map((plan) => {
          return (
            <motion.div
              variants={item}
              key={plan.programName}
              whileHover={{ y: -8, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex relative group rounded-2xl border border-border hover:border-secondary/50 hover:shadow-lg transition-all duration-300 bg-card overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative p-8 flex flex-col flex-1">
                <div className="mb-6">
                  <h3 className="text-2xl font-black mb-2 text-secondary">{plan.programName}</h3>
                  <p className="text-sm font-semibold text-muted-foreground">{plan.overview}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground">S${plan.promo.toLocaleString()}</span>
                    <span className="text-lg text-muted-foreground line-through">S${plan.fees.toLocaleString()}</span>
                  </div>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      50% Early Bird Discount
                    </Badge>
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">Perfect for:</span> {plan.whoItsFor}
                  </p>
                </div>

                <Separator className="my-6" />

                <div className="mb-8">
                  <p className="text-sm font-semibold text-foreground mb-4">What's Included:</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
                        <CircleCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-secondary" strokeWidth={2.5} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => setSchoolFee(plan.programName)}
                  variant={"secondary"}
                  size="lg"
                  className="mt-auto w-full py-6 rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 text-base font-bold">
                  Enrol in {plan.programName} <ArrowUpRight />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="w-full max-w-4xl p-1 rounded-2xl bg-gradient-to-r from-secondary/20 via-primary/20 to-secondary/20">
        <div className="bg-card/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/20 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15 text-secondary">
              <Info className="h-6 w-6" />
            </div>
            <div className="text-center md:text-left">
              <h4 className="text-xl font-bold text-foreground">Still deciding?</h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                Explore the VizSchool methodology and see how we compare to traditional systems.
              </p>
            </div>
          </div>

          <Link
            to={"https://vizschool.org/"}
            target="_blank"
            className={buttonVariants({
              variant: "secondary",
              className: "w-full md:w-auto !px-8 !py-6 !rounded-xl !font-bold gap-2 group transition-all",
            })}>
            Learn more about VizSchool
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SchoolFees;
