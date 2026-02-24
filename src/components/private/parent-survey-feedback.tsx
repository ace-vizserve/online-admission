import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { submitParentFeedback } from "@/actions/private";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import { ArrowLeft } from "lucide-react";

type Feedback = {
  academicYear: string;
  enroleeNumber: string;
  feedbackRating: number;
  feedbackComments?: string;
  feedbackConsent: boolean;
};

const ParentFeedbackSurvey = ({ redirectTo }: { redirectTo?: string }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { state } = useLocation();

  const { academicYear, enroleeNumber } = state;

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      academicYear,
      enroleeNumber,
      feedbackRating,
      feedbackComments,
      feedbackConsent,
    }: Feedback) => {
      return await submitParentFeedback({
        academicYear,
        enroleeNumber,
        feedbackConsent,
        feedbackRating,
        feedbackComments,
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

  const [selectedRating, setSelectedRating] = useState<string>("");
  const [comments, setComments] = useState("");
  const [consent, setConsent] = useState<boolean>(false);

  const maxChars = 500;
  const remainingChars = maxChars - comments.length;

  const ratings = [
    { value: "1", label: "Very Difficult", icon: "😤", color: "hover:bg-red-50" },
    { value: "2", label: "Frustrating", icon: "😟", color: "hover:bg-orange-50" },
    { value: "3", label: "Okay", icon: "🙂", color: "hover:bg-yellow-50" },
    { value: "4", label: "Easy", icon: "😊", color: "hover:bg-green-50" },
    { value: "5", label: "Excellent", icon: "🤩", color: "hover:bg-blue-50" },
  ];

  const handleSkip = () => {
    setOpen(false);
    navigate("/admission/dashboard");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    mutate({
      academicYear,
      enroleeNumber,
      feedbackConsent: consent,
      feedbackRating: Number(selectedRating),
      feedbackComments: comments,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={buttonVariants({
            className: "!px-10 !py-6 !rounded-xl gap-2 !font-bold !shadow-lg !shadow-primary/20",
            size: "lg",
          })}>
          Go to Dashboard <ArrowLeft className="w-4 h-4 rotate-180" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:!max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black text-primary">We'd Love Your Feedback!</DialogTitle>
          <DialogDescription className="text-base">
            Help us improve the enrollment experience for future parents. This will only take a moment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Rating Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">How was the enrollment process?</Label>
            <div className="flex justify-between gap-2">
              {ratings.map((rating) => (
                <button
                  key={rating.value}
                  type="button"
                  onClick={() => setSelectedRating(rating.value)}
                  className={`cursor-pointer flex flex-1 flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all min-h-[80px] ${
                    selectedRating === rating.value
                      ? "border-primary bg-primary/5 shadow-sm scale-105"
                      : "border-gray-200 hover:border-gray-300"
                  } ${rating.color}`}>
                  <span className="text-xl lg:text-3xl">{rating.icon}</span>
                  <span
                    className={`hidden md:inline font-bold text-[11px] ${selectedRating === rating.value && "text-primary"}`}>
                    {rating.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-3">
            <Label htmlFor="feedback-comments" className="text-base font-semibold">
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
              rows={4}
              className="resize-none text-sm"
            />
            <p
              className={`font-medium text-sm text-right ${remainingChars < 50 ? "text-orange-600" : "text-muted-foreground"}`}>
              {remainingChars}/{maxChars} characters remaining
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked === true)}
              className="mt-1"
            />
            <Label htmlFor="consent" className="font-semibold text-sm leading-relaxed cursor-pointer">
              I consent to HFSE Online Admission contacting me to follow up on my feedback
            </Label>
          </div>

          <DialogFooter className="flex-wrap gap-2 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isPending}
              className={buttonVariants({
                className: "!px-10 !py-6 !rounded-xl gap-2 !font-bold !shadow-lg !shadow-primary/20",
                size: "lg",
                variant: "outline",
              })}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={selectedRating == "" || isPending}
              className={buttonVariants({
                className: "!px-10 !py-6 !rounded-xl gap-2 !font-bold !shadow-lg !shadow-primary/20",
                size: "lg",
              })}>
              {isPending ? (
                <div className="flex items-center gap-3">
                  <span>Submitting</span>
                  <DotPulse size="20" speed="1.3" color="white" />
                </div>
              ) : (
                "Submit & Continue"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ParentFeedbackSurvey;
