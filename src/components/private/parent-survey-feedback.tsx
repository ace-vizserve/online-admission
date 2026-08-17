import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { submitParentFeedback } from "@/actions/private";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { howDidYouKnowAboutUs } from "@/data";

import { useMutation } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import { ArrowLeft, ArrowRight, ChevronLeft, Megaphone, MessageSquarePlus, ShieldCheck, Star } from "lucide-react";

type Feedback = {
  academicYear: string;
  enroleeNumber: string;
  feedbackRating: number;
  feedbackComments?: string;
  feedbackConsent: boolean;
  howDidYouKnowAboutHFSEIS: string;
  marketingReferrerName?: string;
};

const ParentFeedbackSurvey = ({ redirectTo }: { redirectTo?: string }) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [referrerName, setReferrerName] = useState<string>("");

  const navigate = useNavigate();
  const { state } = useLocation();

  const { academicYear, enroleeNumber } = state;

  const [howDidYouKnowAboutHFSEIS, setHowDidYouKnowAboutHFSEIS] = useState("");
  const [otherSource, setOtherSource] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [comments, setComments] = useState("");
  const [consent, setConsent] = useState(false);

  const maxChars = 500;
  const remainingChars = maxChars - comments.length;

  const ratings = [
    { value: "1", label: "Very Difficult", icon: "😤" },
    { value: "2", label: "Frustrating", icon: "😟" },
    { value: "3", label: "Okay", icon: "🙂" },
    { value: "4", label: "Easy", icon: "😊" },
    { value: "5", label: "Excellent", icon: "🤩" },
  ];

  const selectedRatingObj = ratings.find((r) => r.value === selectedRating);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setStep(1);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      academicYear,
      enroleeNumber,
      feedbackRating,
      feedbackComments,
      feedbackConsent,
      howDidYouKnowAboutHFSEIS,
      marketingReferrerName,
    }: Feedback) => {
      return await submitParentFeedback({
        academicYear,
        enroleeNumber,
        feedbackConsent,
        feedbackRating,
        feedbackComments,
        howDidYouKnowAboutHFSEIS,
        marketingReferrerName,
      });
    },

    onSuccess() {
      setOpen(false);

      if (redirectTo) {
        navigate("/login");
      } else {
        navigate("/admission/dashboard");
      }
    },
  });

  // Step 1 is the only hard requirement — the marketing source is what the school actually needs,
  // and it used to arrive blank on ~99% of applications because this dialog was skippable.
  const canLeaveStepOne =
    Boolean(howDidYouKnowAboutHFSEIS) &&
    !(howDidYouKnowAboutHFSEIS === "Referral" && !referrerName.trim()) &&
    !(howDidYouKnowAboutHFSEIS === "Other" && !otherSource.trim());

  const submitFeedback = () => {
    mutate({
      academicYear,
      enroleeNumber,
      feedbackConsent: consent,
      feedbackRating: selectedRating ? Number(selectedRating) : 0,
      feedbackComments: comments,
      howDidYouKnowAboutHFSEIS: howDidYouKnowAboutHFSEIS === "Other" ? otherSource.trim() : howDidYouKnowAboutHFSEIS,
      marketingReferrerName: howDidYouKnowAboutHFSEIS === "Referral" ? referrerName.trim() : undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitFeedback();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className={buttonVariants({
            className: "!px-10 !py-6 !rounded-xl gap-2 !font-bold !shadow-lg !shadow-primary/20",
            size: "lg",
          })}>
          Go to Dashboard
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </Button>
      </DialogTrigger>

      {/*
        No close affordance and no dismiss-on-escape/outside-click: the marketing source is
        required, and this dialog sits on the natural exit from the submitted page ("Go to
        Dashboard"). A parent can still close the tab — nothing client-side prevents that — but
        every in-app route out of here now goes through answering the question.
      */}
      <DialogContent
        className="sm:!max-w-xl"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}>
        {/* Step 1 — How did you hear about HFSE */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-primary" />
                </div>

                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl font-black text-primary leading-tight">
                      Quick question first!
                    </DialogTitle>
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      1 of 2
                    </span>
                  </div>

                  <DialogDescription className="text-sm leading-relaxed">
                    How did you hear about HFSE International School?
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 pt-5">
              <div className="flex flex-wrap gap-2">
                {howDidYouKnowAboutUs.map(({ label: option, value }) => {
                  const isSelected = howDidYouKnowAboutHFSEIS === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setHowDidYouKnowAboutHFSEIS(isSelected ? "" : value)}
                      className={`cursor-pointer px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150
                        ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
                        }`}>
                      {option}
                    </button>
                  );
                })}
              </div>

              {howDidYouKnowAboutHFSEIS === "Referral" && (
                <div className="space-y-2 animate-in fade-in duration-150">
                  <Label htmlFor="referrer-name">
                    Referrer's Name <span className="text-destructive">*</span>
                  </Label>

                  <Input
                    id="referrer-name"
                    placeholder="Enter the referrer's name"
                    value={referrerName}
                    onChange={(e) => setReferrerName(e.target.value)}
                    required
                  />
                </div>
              )}

              {howDidYouKnowAboutHFSEIS === "Other" && (
                <div className="space-y-2 animate-in fade-in duration-150">
                  <Label htmlFor="other-source">
                    Please specify <span className="text-destructive">*</span>
                  </Label>

                  <Input
                    id="other-source"
                    placeholder="Please specify"
                    value={otherSource}
                    onChange={(e) => setOtherSource(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-6">
              <p className="text-xs text-muted-foreground">
                {canLeaveStepOne ? "Thanks — one more quick question." : "Please pick an option to continue."}
              </p>

              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canLeaveStepOne}
                className="px-8 py-5 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Rating */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <MessageSquarePlus className="w-6 h-6 text-primary" />
                </div>

                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl font-black text-primary leading-tight">
                      We'd Love Your Feedback!
                    </DialogTitle>
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      2 of 2
                    </span>
                  </div>

                  <DialogDescription className="text-sm leading-relaxed">
                    Help us improve the enrollment experience for future parents.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Rating */}
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary shrink-0" />
                  <Label className="text-sm font-semibold">How was the enrollment process?</Label>
                </div>

                {selectedRatingObj && (
                  <span className="text-xs font-semibold text-primary animate-in fade-in slide-in-from-right-2 duration-200">
                    {selectedRatingObj.label}
                  </span>
                )}
              </div>

              <div className="flex justify-between gap-2">
                {ratings.map((rating) => (
                  <button
                    key={rating.value}
                    type="button"
                    onClick={() => setSelectedRating(rating.value)}
                    className={`cursor-pointer flex flex-1 flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 min-h-[72px]
                      ${
                        selectedRating === rating.value
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 scale-105 shadow-sm"
                          : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                      }`}>
                    <span className="text-2xl lg:text-3xl leading-none">{rating.icon}</span>

                    <span
                      className={`hidden md:inline font-semibold text-[10px] leading-tight text-center transition-colors duration-200
                        ${selectedRating === rating.value ? "text-primary" : "text-muted-foreground"}`}>
                      {rating.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="feedback-comments" className="text-sm font-semibold">
                Any other comments? <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>

              <Textarea
                id="feedback-comments"
                placeholder="Share your thoughts, suggestions, or any issues you encountered..."
                value={comments}
                onChange={(e) => {
                  if (e.target.value.length <= maxChars) {
                    setComments(e.target.value);
                  }
                }}
                rows={3}
                className="resize-none text-sm"
              />

              <p
                className={`font-medium text-xs text-right ${
                  remainingChars < 50 ? "text-destructive" : "text-muted-foreground"
                }`}>
                {remainingChars}/{maxChars} characters remaining
              </p>
            </div>

            {/* Consent */}
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />

              <div className="flex items-start gap-2 flex-1">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                  className="mt-0.5 shrink-0"
                />

                <Label htmlFor="consent" className="font-medium text-sm leading-relaxed cursor-pointer">
                  I consent to HFSE Online Admission contacting me to follow up on my feedback
                </Label>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isPending}
                className="px-6 py-5 rounded-xl font-semibold gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <div className="flex items-center gap-2">
                {/*
                  The rating stays optional — only the step 1 source is required. Without this the
                  removal of "Skip for now" would have silently made rating mandatory too, trapping
                  a parent who answered the source but doesn't want to rate. This still submits, so
                  the source is persisted either way.
                */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={submitFeedback}
                  disabled={isPending}
                  className="px-4 py-5 rounded-xl font-semibold text-muted-foreground">
                  Skip feedback
                </Button>

                <Button
                  disabled={isPending || !selectedRating}
                  className="px-8 py-5 rounded-xl font-bold shadow-lg shadow-primary/20">
                  {isPending ? (
                    <div className="flex items-center gap-3">
                      <span>Submitting</span>
                      <DotPulse size="20" speed="1.3" color="white" />
                    </div>
                  ) : (
                    "Submit & Continue"
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ParentFeedbackSurvey;
