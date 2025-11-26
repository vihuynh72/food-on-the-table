import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Apple,
  Package,
  ChefHat,
  Leaf,
  Trash2,
  Users,
  Heart,
  Snowflake,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TriageQuizProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuizState {
  foodItem: string;
  foodType: string;
  condition: string;
  packaging: string;
  daysSince: number;
  storage: string;
}

interface Recommendation {
  action: string;
  icon: LucideIcon;
  reason: string;
  priority: "primary" | "secondary";
}

const FOOD_TYPES = [
  { value: "fresh-produce", label: "Fresh Produce", icon: Apple },
  { value: "packaged-unopened", label: "Packaged (Unopened)", icon: Package },
  { value: "packaged-opened", label: "Packaged (Opened)", icon: Package },
  { value: "leftovers", label: "Leftovers", icon: ChefHat },
  { value: "raw-meat", label: "Raw Meat/Fish", icon: AlertCircle },
  { value: "dairy", label: "Dairy Products", icon: Package },
];

const CONDITIONS = [
  { value: "normal", label: "Normal (looks & smells fine)" },
  { value: "slightly-off", label: "Slightly off (minor changes)" },
  { value: "moldy", label: "Moldy or spoiled" },
  { value: "not-sure", label: "Not sure" },
];

const STORAGE_OPTIONS = [
  { value: "fridge", label: "Fridge" },
  { value: "freezer", label: "Freezer" },
  { value: "pantry", label: "Pantry" },
];

export function TriageQuiz({ open, onOpenChange }: TriageQuizProps) {
  const [step, setStep] = useState(1);
  const [quizState, setQuizState] = useState<QuizState>({
    foodItem: "",
    foodType: "",
    condition: "",
    packaging: "sealed",
    daysSince: 3,
    storage: "fridge",
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const updateState = <K extends keyof QuizState>(key: K, value: QuizState[K]) => {
    setQuizState((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const reset = () => {
    setStep(1);
    setQuizState({
      foodItem: "",
      foodType: "",
      condition: "",
      packaging: "sealed",
      daysSince: 3,
      storage: "fridge",
    });
  };

  const getRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // Check if food is moldy or spoiled
    if (quizState.condition === "moldy") {
      recommendations.push({
        action: "Compost",
        icon: Leaf,
        reason: "Food showing mold or spoilage should be composted or discarded safely",
        priority: "primary",
      });
      return recommendations;
    }

    // Check for donation eligibility
    if (
      quizState.condition === "normal" &&
      quizState.packaging === "sealed" &&
      (quizState.foodType === "packaged-unopened" ||
        quizState.foodType === "fresh-produce")
    ) {
      recommendations.push({
        action: "Donate",
        icon: Heart,
        reason: "Unopened and in good condition - perfect for food banks",
        priority: "primary",
      });
    }

    // Check for sharing eligibility
    if (
      quizState.condition === "normal" &&
      quizState.foodType !== "raw-meat" &&
      quizState.daysSince <= 2
    ) {
      recommendations.push({
        action: "Share",
        icon: Users,
        reason: "Fresh and safe - great for sharing with neighbors",
        priority: recommendations.length === 0 ? "primary" : "secondary",
      });
    }

    // Check for eating/cooking
    if (
      quizState.condition === "normal" ||
      quizState.condition === "slightly-off"
    ) {
      recommendations.push({
        action: "Cook & Eat",
        icon: ChefHat,
        reason: "Still safe to consume - use it in your next meal",
        priority: recommendations.length === 0 ? "primary" : "secondary",
      });
    }

    // Check for freezing
    if (
      quizState.storage !== "freezer" &&
      quizState.condition === "normal" &&
      quizState.foodType !== "dairy"
    ) {
      recommendations.push({
        action: "Freeze",
        icon: Snowflake,
        reason: "Preserve for later use by freezing",
        priority: "secondary",
      });
    }

    // Default to discard if conditions are uncertain
    if (
      quizState.condition === "not-sure" ||
      recommendations.length === 0
    ) {
      recommendations.push({
        action: "Discard Safely",
        icon: Trash2,
        reason: "When in doubt, it's safer to discard responsibly",
        priority: recommendations.length === 0 ? "primary" : "secondary",
      });
    }

    return recommendations;
  };

  const handleComplete = () => {
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-woodland">
            Food Triage Quiz
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Answer a few questions to get personalized recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step 1: Food Type */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-woodland">
                What type of food is this?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FOOD_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => updateState("foodType", type.value)}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      quizState.foodType === type.value
                        ? "border-woodland bg-pine-glade"
                        : "border-border bg-background hover:border-asparagus"
                    }`}
                  >
                    <type.icon className="w-6 h-6 text-woodland" />
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Condition */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-woodland">
                What's the condition of the food?
              </h3>
              <RadioGroup
                value={quizState.condition}
                onValueChange={(value) => updateState("condition", value)}
                className="space-y-3"
              >
                {CONDITIONS.map((condition) => (
                  <div
                    key={condition.value}
                    className="flex items-center space-x-3 p-4 rounded-lg border-2 border-border hover:border-asparagus transition-colors"
                  >
                    <RadioGroupItem
                      value={condition.value}
                      id={condition.value}
                    />
                    <Label
                      htmlFor={condition.value}
                      className="flex-1 cursor-pointer font-medium"
                    >
                      {condition.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 3: Packaging & Timing */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-woodland">
                  Is the packaging sealed?
                </h3>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={quizState.packaging === "sealed" ? "default" : "outline"}
                    onClick={() => updateState("packaging", "sealed")}
                    className="flex-1"
                  >
                    Sealed
                  </Button>
                  <Button
                    type="button"
                    variant={quizState.packaging === "unsealed" ? "default" : "outline"}
                    onClick={() => updateState("packaging", "unsealed")}
                    className="flex-1"
                  >
                    Unsealed
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-woodland">
                  How many days since cooked/purchased?
                </h3>
                <div className="space-y-2">
                  <Slider
                    value={[quizState.daysSince]}
                    onValueChange={(value) => updateState("daysSince", value[0])}
                    max={14}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Today</span>
                    <span className="font-semibold text-woodland">
                      {quizState.daysSince} {quizState.daysSince === 1 ? "day" : "days"}
                    </span>
                    <span>2 weeks</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Storage */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-woodland">
                Where is it stored?
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {STORAGE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={quizState.storage === option.value ? "default" : "outline"}
                    onClick={() => updateState("storage", option.value)}
                    className="h-auto py-4"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* Recommendations */}
              <div className="mt-8 space-y-4">
                <h3 className="text-xl font-bold text-woodland">
                  Recommendations
                </h3>
                <p className="text-sm text-muted-foreground">
                  Based on your answers, here are the best actions for this food:
                </p>
                <div className="space-y-3">
                  {getRecommendations().map((rec, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 flex items-start gap-4 ${
                        rec.priority === "primary"
                          ? "bg-woodland text-white border-woodland"
                          : "bg-pine-glade border-asparagus"
                      }`}
                    >
                      <rec.icon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-lg">{rec.action}</h4>
                        <p
                          className={`text-sm ${
                            rec.priority === "primary"
                              ? "text-white/90"
                              : "text-foreground/80"
                          }`}
                        >
                          {rec.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              Back
            </Button>
            {step < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={
                  (step === 1 && !quizState.foodType) ||
                  (step === 2 && !quizState.condition)
                }
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete}>Done</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
