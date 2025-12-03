import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Apple,
  Package,
  ChefHat,
  Leaf,
  Trash2,
  Users,
  Heart,
  Snowflake,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RefreshCw,
  Utensils,
  Cookie,
  AlertTriangle
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useNavigate } from "react-router-dom";

interface TriageQuizProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

type StepId = 
  | "start"
  | "produce_condition"
  | "packaged_status"
  | "packaged_date"
  | "packaged_open_age"
  | "leftovers_age"
  | "meat_dairy_condition"
  | "bakery_condition"
  | "result_donate"
  | "result_donate_caution"
  | "result_share"
  | "result_eat"
  | "result_eat_soon"
  | "result_eat_caution"
  | "result_cook_immediately"
  | "result_repurpose"
  | "result_compost"
  | "result_discard";

interface QuizOption {
  id: string;
  label: string;
  icon?: LucideIcon;
  nextStep: StepId;
}

interface QuizStep {
  id: StepId;
  question: string;
  description?: string;
  options?: QuizOption[];
  isResult?: boolean;
  resultData?: {
    title: string;
    description: string;
    primaryAction: {
      label: string;
      icon: LucideIcon;
      color: string; // tailwind class
      href?: string;
    };
    secondaryActions: {
      label: string;
      icon: LucideIcon;
      href?: string;
    }[];
  };
}

const STEPS: Record<StepId, QuizStep> = {
  start: {
    id: "start",
    question: "What kind of food is it?",
    description: "Select the category that best fits.",
    options: [
      { id: "produce", label: "Fresh Produce", icon: Apple, nextStep: "produce_condition" },
      { id: "packaged", label: "Packaged Food", icon: Package, nextStep: "packaged_status" },
      { id: "leftovers", label: "Leftovers", icon: ChefHat, nextStep: "leftovers_age" },
      { id: "meat_dairy", label: "Meat / Dairy", icon: AlertTriangle, nextStep: "meat_dairy_condition" },
      { id: "bakery", label: "Bakery", icon: Cookie, nextStep: "bakery_condition" },
    ]
  },
  produce_condition: {
    id: "produce_condition",
    question: "How does it look?",
    options: [
      { id: "perfect", label: "Perfect! Just extra.", icon: CheckCircle2, nextStep: "result_donate" },
      { id: "wilted", label: "A bit wilted or bruised.", icon: HelpCircle, nextStep: "result_eat_soon" },
      { id: "moldy", label: "Moldy or slimy.", icon: XCircle, nextStep: "result_compost" },
    ]
  },
  packaged_status: {
    id: "packaged_status",
    question: "Is the package open?",
    options: [
      { id: "sealed", label: "No, it's sealed.", icon: Package, nextStep: "packaged_date" },
      { id: "open", label: "Yes, it's open.", icon: Utensils, nextStep: "packaged_open_age" },
    ]
  },
  packaged_date: {
    id: "packaged_date",
    question: "Check the expiration date.",
    options: [
      { id: "within", label: "Within date.", icon: CheckCircle2, nextStep: "result_donate" },
      { id: "best_by", label: "Past 'Best By' date.", icon: HelpCircle, nextStep: "result_donate_caution" },
      { id: "use_by", label: "Past 'Use By' date.", icon: XCircle, nextStep: "result_compost" },
    ]
  },
  packaged_open_age: {
    id: "packaged_open_age",
    question: "When did you open it?",
    options: [
      { id: "recent", label: "Recently (1-3 days).", icon: Clock, nextStep: "result_eat" },
      { id: "while", label: "A while ago (4-7 days).", icon: HelpCircle, nextStep: "result_eat_caution" },
      { id: "ancient", label: "Ancient history.", icon: Trash2, nextStep: "result_compost" },
    ]
  },
  leftovers_age: {
    id: "leftovers_age",
    question: "When was this cooked?",
    options: [
      { id: "fresh", label: "Today or Yesterday.", icon: CheckCircle2, nextStep: "result_share" },
      { id: "ok", label: "2-3 days ago.", icon: Clock, nextStep: "result_eat" },
      { id: "old", label: "4+ days ago.", icon: Trash2, nextStep: "result_compost" },
    ]
  },
  meat_dairy_condition: {
    id: "meat_dairy_condition",
    question: "Does it smell or look off?",
    options: [
      { id: "fresh", label: "No, seems fresh.", icon: CheckCircle2, nextStep: "result_cook_immediately" },
      { id: "suspicious", label: "A little suspicious.", icon: HelpCircle, nextStep: "result_compost" },
      { id: "bad", label: "Definitely bad.", icon: XCircle, nextStep: "result_discard" },
    ]
  },
  bakery_condition: {
    id: "bakery_condition",
    question: "How is the texture?",
    options: [
      { id: "fresh", label: "Fresh / Soft.", icon: CheckCircle2, nextStep: "result_share" },
      { id: "stale", label: "Stale / Hard.", icon: HelpCircle, nextStep: "result_repurpose" },
      { id: "moldy", label: "Moldy.", icon: XCircle, nextStep: "result_compost" },
    ]
  },
  // Results
  result_donate: {
    id: "result_donate",
    question: "Great for Donation!",
    isResult: true,
    resultData: {
      title: "Donate This Item",
      description: "This item appears to be in perfect condition for donation. Local food banks would love to have it!",
      primaryAction: { label: "Find Donation Spot", icon: Heart, color: "bg-woodland hover:bg-woodland/90", href: "/donate" },
      secondaryActions: [{ label: "Share with Neighbors", icon: Users, href: "/community" }, { label: "Eat it yourself", icon: Utensils, href: "/my-food" }]
    }
  },
  result_donate_caution: {
    id: "result_donate_caution",
    question: "Check Local Rules",
    isResult: true,
    resultData: {
      title: "Maybe Donatable",
      description: "Some food banks accept items past 'Best By' dates, but not all. Check with them first.",
      primaryAction: { label: "Contact Food Bank", icon: Heart, color: "bg-asparagus hover:bg-asparagus/90", href: "/donate" },
      secondaryActions: [{ label: "Eat it yourself", icon: Utensils, href: "/my-food" }, { label: "Compost", icon: Leaf, href: "/donate" }]
    }
  },
  result_share: {
    id: "result_share",
    question: "Share with Neighbors!",
    isResult: true,
    resultData: {
      title: "Perfect for Sharing",
      description: "This is great for a neighbor who might need a meal or ingredients.",
      primaryAction: { label: "Post to Community", icon: Users, color: "bg-woodland hover:bg-woodland/90", href: "/community" },
      secondaryActions: [{ label: "Eat it yourself", icon: Utensils, href: "/my-food" }, { label: "Freeze", icon: Snowflake, href: "/learn" }]
    }
  },
  result_eat: {
    id: "result_eat",
    question: "Eat it Soon!",
    isResult: true,
    resultData: {
      title: "Best to Eat Now",
      description: "It's good to eat, but might not be suitable for donation due to being open or older.",
      primaryAction: { label: "Find Recipes", icon: ChefHat, color: "bg-pine-glade text-woodland hover:bg-pine-glade/80", href: "/my-food" },
      secondaryActions: [{ label: "Freeze", icon: Snowflake, href: "/learn" }, { label: "Share", icon: Users, href: "/community" }]
    }
  },
  result_eat_soon: {
    id: "result_eat_soon",
    question: "Use Immediately",
    isResult: true,
    resultData: {
      title: "Eat or Cook Now",
      description: "It's a bit past its prime visually, but still edible. Cook it to hide imperfections!",
      primaryAction: { label: "Find Recipes", icon: ChefHat, color: "bg-pine-glade text-woodland hover:bg-pine-glade/80", href: "/my-food" },
      secondaryActions: [{ label: "Smoothie/Soup", icon: RefreshCw, href: "/my-food" }, { label: "Compost", icon: Leaf, href: "/donate" }]
    }
  },
  result_eat_caution: {
    id: "result_eat_caution",
    question: "Use Caution",
    isResult: true,
    resultData: {
      title: "Smell Test Required",
      description: "It's on the edge. If it smells fine, eat it now. Otherwise, don't risk it.",
      primaryAction: { label: "Find Recipes", icon: ChefHat, color: "bg-pine-glade text-woodland hover:bg-pine-glade/80", href: "/my-food" },
      secondaryActions: [{ label: "Compost", icon: Leaf, href: "/donate" }]
    }
  },
  result_cook_immediately: {
    id: "result_cook_immediately",
    question: "Cook Immediately",
    isResult: true,
    resultData: {
      title: "Cook Thoroughly",
      description: "Raw meat/dairy should be used ASAP if it's been a while. Cook it well.",
      primaryAction: { label: "Find Recipes", icon: ChefHat, color: "bg-woodland hover:bg-woodland/90", href: "/my-food" },
      secondaryActions: [{ label: "Freeze (if cooked)", icon: Snowflake, href: "/learn" }]
    }
  },
  result_repurpose: {
    id: "result_repurpose",
    question: "Repurpose It!",
    isResult: true,
    resultData: {
      title: "Give it New Life",
      description: "Stale bread makes great croutons or bread pudding!",
      primaryAction: { label: "Repurpose Ideas", icon: RefreshCw, color: "bg-asparagus hover:bg-asparagus/90", href: "/learn" },
      secondaryActions: [{ label: "Compost", icon: Leaf, href: "/donate" }]
    }
  },
  result_compost: {
    id: "result_compost",
    question: "Compost It",
    isResult: true,
    resultData: {
      title: "Time to Compost",
      description: "It's not safe to eat, but it can still feed the soil!",
      primaryAction: { label: "Find Compost Site", icon: Leaf, color: "bg-woodland hover:bg-woodland/90", href: "/donate" },
      secondaryActions: [{ label: "Discard", icon: Trash2 }]
    }
  },
  result_discard: {
    id: "result_discard",
    question: "Discard Safely",
    isResult: true,
    resultData: {
      title: "Trash It",
      description: "This item shouldn't be eaten or composted (e.g. meat in some composts).",
      primaryAction: { label: "Discard", icon: Trash2, color: "bg-destructive text-destructive-foreground hover:bg-destructive/90" },
      secondaryActions: []
    }
  },
};

export function TriageQuiz({ open, onOpenChange, onComplete }: TriageQuizProps) {
  const navigate = useNavigate();
  const [history, setHistory] = useState<StepId[]>(["start"]);
  const currentStepId = history[history.length - 1];
  const currentStep = STEPS[currentStepId];

  // Calculate progress (approximate)
  const progress = Math.min((history.length / 4) * 100, 100);

  const handleOptionClick = (nextStep: StepId) => {
    setHistory([...history, nextStep]);
  };

  const handleBack = () => {
    if (history.length > 1) {
      setHistory(history.slice(0, -1));
    }
  };

  const handleReset = () => {
    setHistory(["start"]);
  };

  const handleComplete = (path?: string) => {
    onOpenChange(false);
    onComplete?.();
    if (path) {
      navigate(path);
    }
    setTimeout(handleReset, 300); // Reset after animation
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background border-woodland/20">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-2xl font-bold text-woodland flex items-center gap-2">
              {currentStep.isResult ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-asparagus" />
                  Recommendation
                </>
              ) : (
                "Food Triage"
              )}
            </DialogTitle>
            {!currentStep.isResult && (
              <span className="text-sm text-muted-foreground font-medium">
                Step {history.length}
              </span>
            )}
          </div>
          
          {!currentStep.isResult && (
            <Progress value={progress} className="h-2 mb-6 bg-pine-glade/30" />
          )}
        </div>

        <div className="px-6 pb-6 min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  {currentStep.question}
                </h3>
                {currentStep.description && (
                  <p className="text-muted-foreground">
                    {currentStep.description}
                  </p>
                )}
              </div>

              {currentStep.isResult && currentStep.resultData ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-pine-glade/20 border border-pine-glade/50">
                    <h4 className="font-bold text-lg text-woodland mb-2">
                      {currentStep.resultData.title}
                    </h4>
                    <p className="text-foreground/80">
                      {currentStep.resultData.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      className={`w-full h-12 text-lg ${currentStep.resultData.primaryAction.color}`}
                      onClick={() => handleComplete(currentStep.resultData?.primaryAction.href)}
                    >
                      <currentStep.resultData.primaryAction.icon className="mr-2 h-5 w-5" />
                      {currentStep.resultData.primaryAction.label}
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {currentStep.resultData.secondaryActions.map((action, idx) => (
                        <Button 
                          key={idx} 
                          variant="outline" 
                          className="w-full border-woodland/20 hover:bg-pine-glade/20"
                          onClick={() => handleComplete(action.href)}
                        >
                          <action.icon className="mr-2 h-4 w-4 text-woodland" />
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Button variant="ghost" onClick={handleReset} className="w-full text-muted-foreground hover:text-woodland">
                    Start Over
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {currentStep.options?.map((option) => (
                    <Card
                      key={option.id}
                      className="p-4 cursor-pointer hover:border-woodland hover:bg-pine-glade/10 transition-all group flex items-center gap-4"
                      onClick={() => handleOptionClick(option.nextStep)}
                    >
                      {option.icon && (
                        <div className="p-2 rounded-full bg-pine-glade/20 text-woodland group-hover:bg-woodland group-hover:text-white transition-colors">
                          <option.icon className="w-6 h-6" />
                        </div>
                      )}
                      <span className="font-medium text-lg">{option.label}</span>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {!currentStep.isResult && history.length > 1 && (
          <div className="p-4 border-t bg-muted/10 flex justify-start">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
