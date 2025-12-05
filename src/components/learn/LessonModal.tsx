import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight,
  Utensils,
  Gift,
  Users,
  X
} from "lucide-react";
import { LearnLesson, QuizQuestion } from "@/hooks/useLearnContent";
import { QuizForm } from "./QuizForm";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

interface LessonModalProps {
  lesson: LearnLesson | null;
  isCompleted: boolean;
  onClose: () => void;
  onComplete: (quizScore?: number) => void;
  isCompletingLesson: boolean;
}

const typeIcons = {
  article: FileText,
  quiz: HelpCircle,
};

const typeLabels = {
  article: "Article",
  quiz: "Quiz",
};

const ctaConfig = {
  triage: {
    icon: Utensils,
    label: "Start Triage Quiz",
    path: "/my-food",
  },
  donate: {
    icon: Gift,
    label: "Find Donation Centers",
    path: "/donate",
  },
  community: {
    icon: Users,
    label: "Visit Community",
    path: "/community",
  },
};

export function LessonModal({ lesson, isCompleted, onClose, onComplete, isCompletingLesson }: LessonModalProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (lesson) {
      startTimeRef.current = Date.now();
    }
  }, [lesson?.id]);

  if (!lesson) return null;

  const TypeIcon = typeIcons[lesson.type];
  const ctaInfo = lesson.cta_type ? ctaConfig[lesson.cta_type as keyof typeof ctaConfig] : null;

  const handleMarkComplete = () => {
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    onComplete();
  };

  const handleQuizComplete = (score: number) => {
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    onComplete(score);
  };

  const handleCtaClick = () => {
    if (ctaInfo) {
      navigate(ctaInfo.path);
      onClose();
    }
  };

  // Parse quiz content if it's a quiz
  let quizQuestions: QuizQuestion[] = [];
  if (lesson.type === 'quiz' && lesson.content) {
    try {
      quizQuestions = JSON.parse(lesson.content);
    } catch (e) {
      console.error("Failed to parse quiz content:", e);
    }
  }

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6 pr-8">
        <div className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0",
          "bg-gradient-to-br from-pine-glade/50 to-raffia/50"
        )}>
          {lesson.thumbnail || "📚"}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              <TypeIcon className="w-3 h-3 mr-1" />
              {typeLabels[lesson.type]}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lesson.duration} min
            </span>
            {isCompleted && (
              <Badge className="bg-asparagus text-white text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-bold">{lesson.title}</h2>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 pr-4">
        {lesson.type === 'article' && lesson.content && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold mt-6 mb-3 text-foreground">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 text-muted-foreground leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-1 mb-4 ml-4">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-muted-foreground">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-asparagus pl-4 italic my-4 text-muted-foreground bg-pine-glade/10 py-2 rounded-r">
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
              }}
            >
              {lesson.content}
            </ReactMarkdown>
          </div>
        )}

        {lesson.type === 'quiz' && quizQuestions.length > 0 && (
          <QuizForm
            questions={quizQuestions}
            onComplete={handleQuizComplete}
          />
        )}
      </ScrollArea>

      {/* Footer - Only for non-quiz lessons */}
      {lesson.type !== 'quiz' && (
        <div className="flex flex-col gap-3 pt-4 border-t mt-4">
          {ctaInfo && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleCtaClick}
            >
              <ctaInfo.icon className="w-4 h-4" />
              {lesson.cta_label || ctaInfo.label}
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          )}
          
          {!isCompleted && (
            <Button
              className="w-full gap-2"
              onClick={handleMarkComplete}
              disabled={isCompletingLesson}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isCompletingLesson ? "Saving..." : "Mark as Complete"}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  // Mobile: Full-screen sheet
  if (isMobile) {
    return (
      <Sheet open={!!lesson} onOpenChange={() => onClose()}>
        <SheetContent side="bottom" className="h-[95vh] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{lesson.title}</SheetTitle>
          </SheetHeader>
          <div className="p-6 h-full relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-10"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Side panel dialog
  return (
    <Dialog open={!!lesson} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{lesson.title}</DialogTitle>
        </DialogHeader>
        <div className="p-6 h-full max-h-[85vh] overflow-hidden flex flex-col">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
