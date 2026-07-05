import { cn, wait } from "@/lib/utils";
import { CheckedState } from "@radix-ui/react-checkbox";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion, Variants } from "motion/react";
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
  hideStepIndicators?: boolean;
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
  hideStepIndicators = false,
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
      <div
        className={`mx-auto w-full max-w-4xl ${stepCircleContainerClassName} animate-in fade-in slide-in-from-bottom-1 duration-500`}>
        <div className={`${stepContainerClassName} flex w-full max-w-sm mx-auto justify-center items-center space-x-2`}>
          {!hideStepIndicators &&
            stepsArray.map((_, index) => {
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
          className={`space-y-2 px-6 md:px-8 ${contentClassName}`}>
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={`px-8 pb-8 ${footerClassName}`}>
            <div className={`mt-10 flex justify-between`}>
              {isLastStep ? (
                <div className="w-full flex flex-col-reverse gap-4 md:flex-row md:gap-0 justify-between items-center space-x-2">
                  <Button
                    variant={"ghost"}
                    onClick={handleBack}
                    className={`w-full sm:w-max !p-6 rounded-xl bg-slate-100 duration-350 transition gap-2 font-bold ${
                      currentStep === 1
                        ? "pointer-events-none opacity-50 text-neutral-400"
                        : "text-muted-foreground hover:text-neutral-800"
                    }`}
                    {...backButtonProps}>
                    <ArrowLeft />

                    {backButtonText}
                  </Button>
                  <div className="w-full sm:w-max p-4 rounded-xl bg-secondary flex justify-center items-center space-x-4 text-white">
                    <Checkbox
                      className="cursor-pointer size-5 rounded-full data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 bg-white border-white"
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
                      className="cursor-pointer text-xs sm:text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Continue to application
                    </label>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-4 md:flex-row md:gap-0 justify-between items-center space-x-2">
                  <div className="w-full sm:w-max p-4 rounded-xl bg-green-50 border border-green-400 flex justify-center items-center space-x-2">
                    <Checkbox
                      className="cursor-pointer size-5 rounded-full data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      checked={isFirstPageChecked}
                      onCheckedChange={setIsFirstPageChecked}
                      id="terms"
                    />
                    <label
                      htmlFor="terms"
                      className="cursor-pointer text-xs sm:text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I/We agree to the enrolment terms
                    </label>
                  </div>

                  <Button
                    disabled={!isFirstPageChecked}
                    onClick={handleNext}
                    className="font-bold gap-2 !p-6 !rounded-xl w-full sm:w-max"
                    {...nextButtonProps}>
                    {nextButtonText}
                    <ArrowRight />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
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
