import { cn, wait } from "@/lib/utils";
import { CheckedState } from "@radix-ui/react-checkbox";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import React, { Children, HTMLAttributes, ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Button } from "./button";
import { Checkbox } from "./checkbox";

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  backButtonText?: string;
  nextButtonText?: string;
  disableStepIndicators?: boolean;
  renderStepIndicator?: (props: {
    step: number;
    currentStep: number;
    onStepClick: (clicked: number) => void;
  }) => ReactNode;
}

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  stepCircleContainerClassName = "",
  stepContainerClassName = "",
  contentClassName = "",
  footerClassName = "",
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = "Back",
  nextButtonText = "Continue",
  disableStepIndicators = false,
  renderStepIndicator,
  ...rest
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [isFirstPageChecked, setIsFirstPageChecked] = useState<CheckedState>(false);
  const [direction, setDirection] = useState<number>(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center p-4" {...rest}>
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{
          type: "spring",
        }}
        className={`mx-auto w-full max-w-4xl ${stepCircleContainerClassName}`}>
        <div
          className={`${stepContainerClassName} flex w-full max-w-sm mx-auto justify-center items-center p-8 space-x-2`}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;

            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: (clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    },
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={(clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`space-y-2 px-8 ${contentClassName}`}>
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={`px-8 pb-8 ${footerClassName}`}>
            <div className={`mt-10 flex justify-between`}>
              {isLastStep ? (
                <div className="w-full flex flex-col-reverse gap-6 md:flex-row md:gap-0 justify-between items-center space-x-2">
                  <Button
                    variant={"ghost"}
                    onClick={handleBack}
                    className={`duration-350 transition gap-2 ${
                      currentStep === 1
                        ? "pointer-events-none opacity-50 text-neutral-400"
                        : "text-neutral-400 hover:text-neutral-700"
                    }`}
                    {...backButtonProps}>
                    <ArrowLeft />

                    {backButtonText}
                  </Button>
                  <div className="flex justify-center items-center space-x-2">
                    <Checkbox
                      className="size-5 rounded-full data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      onCheckedChange={async (checked) => {
                        if (checked) {
                          await wait(250);
                          handleComplete();
                        }
                      }}
                      id="terms"
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I/We agree to the enrolment promo and discount terms
                    </label>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-6 md:flex-row md:gap-0 justify-between items-center space-x-2">
                  <div className="flex justify-center items-center space-x-2">
                    <Checkbox
                      className="size-5 rounded-full data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      checked={isFirstPageChecked}
                      onCheckedChange={setIsFirstPageChecked}
                      id="terms"
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I/We agree to the enrolment terms
                    </label>
                  </div>

                  <Button
                    disabled={!isFirstPageChecked}
                    onClick={handleNext}
                    className=" bg-green-600 text-white transition hover:bg-green-500 active:bg-green-600 gap-2"
                    {...nextButtonProps}>
                    {nextButtonText}
                    <ArrowRight />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

interface StepContentWrapperProps {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: ReactNode;
  className?: string;
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = "",
}: StepContentWrapperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useLayoutEffect(() => {
    if (containerRef.current) {
      const newHeight = containerRef.current.offsetHeight;
      setHeight(newHeight);
    }
  }, [children, currentStep]);

  const handleAnimationComplete = () => {
    // After animation completes, allow the height to be auto for flexibility
    setHeight("auto");
  };

  return (
    <motion.div
      style={{ position: "relative", overflow: "hidden" }}
      animate={{ height: isCompleted ? 0 : height }}
      transition={{ type: "spring", duration: 0.4 }}
      onAnimationComplete={handleAnimationComplete}
      className={className}>
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SlideTransitionProps {
  children: ReactNode;
  direction: number;
}

function SlideTransition({ children, direction }: SlideTransitionProps) {
  return (
    <motion.div
      className="w-full"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: "easeInOut" }}>
      {children}
    </motion.div>
  );
}

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    position: "absolute",
  }),
  center: {
    x: 0,
    opacity: 1,
    position: "relative",
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
    position: "absolute",
  }),
};

interface StepProps {
  children: ReactNode;
}

export function Step({ children }: StepProps) {
  return <div>{children}</div>;
}

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  onClickStep: (clicked: number) => void;
  disableStepIndicators?: boolean;
}

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators = false }: StepIndicatorProps) {
  const status = currentStep === step ? "active" : currentStep < step ? "inactive" : "complete";

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      className={cn("relative cursor-pointer outline-none focus:outline-none", {
        "cursor-not-allowed": disableStepIndicators,
      })}
      animate={status}
      initial={false}>
      <motion.div
        variants={{
          inactive: {
            scale: 1,
            backgroundColor: "rgba(34, 197, 94, 0.10)",
            color: "rgba(34, 197, 94, 0.3)",
          },
          active: {
            scale: 1,
            backgroundColor: "rgba(34, 197, 94, 1)",
            color: "#fff",
          },
          complete: {
            scale: 1,
            backgroundColor: "rgba(34, 197, 94, 0.65)",
            color: "#fff",
          },
        }}
        transition={{ duration: 0.3 }}
        className="flex h-4 w-4 items-center justify-center rounded-full font-semibold"
      />
    </motion.div>
  );
}

// interface StepConnectorProps {
//   isComplete: boolean;
// }

// function StepConnector({ isComplete }: StepConnectorProps) {
//   const lineVariants: Variants = {
//     incomplete: { width: 0, backgroundColor: "transparent" },
//     complete: { width: "100%", backgroundColor: "#5227FF" },
//   };

//   return (
//     <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-neutral-600">
//       <motion.div
//         className="absolute left-0 top-0 h-full"
//         variants={lineVariants}
//         initial={false}
//         animate={isComplete ? "complete" : "incomplete"}
//         transition={{ duration: 0.4 }}
//       />
//     </div>
//   );
// }

// interface CheckIconProps extends React.SVGProps<SVGSVGElement> {
//   className: string;
// }

// function CheckIcon(props: CheckIconProps) {
//   return (
//     <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
//       <motion.path
//         initial={{ pathLength: 0 }}
//         animate={{ pathLength: 1 }}
//         transition={{
//           delay: 0.1,
//           type: "tween",
//           ease: "easeOut",
//           duration: 0.3,
//         }}
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         d="M5 13l4 4L19 7"
//       />
//     </svg>
//   );
// }
