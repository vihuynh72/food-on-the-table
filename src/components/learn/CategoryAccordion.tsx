import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CategoryWithProgress, LearnLesson } from "@/hooks/useLearnContent";
import { LessonCard } from "./LessonCard";
import { cn } from "@/lib/utils";

interface CategoryAccordionProps {
  categories: CategoryWithProgress[];
  onLessonClick: (lesson: LearnLesson) => void;
  isLessonCompleted: (lessonId: string) => boolean;
  defaultExpanded?: string;
}

const categoryColors: Record<string, string> = {
  woodland: "bg-woodland/10 border-woodland/20 text-woodland",
  asparagus: "bg-asparagus/10 border-asparagus/20 text-asparagus",
  "pine-glade": "bg-pine-glade border-pine-glade/50 text-woodland",
  raffia: "bg-raffia/30 border-raffia/50 text-woodland",
  "desert-sand": "bg-desert-sand/30 border-desert-sand/50 text-woodland",
};

export function CategoryAccordion({
  categories,
  onLessonClick,
  isLessonCompleted,
  defaultExpanded,
}: CategoryAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultExpanded}
      className="space-y-3"
    >
      {categories.map((category) => {
        const progressPercent = category.totalCount > 0
          ? (category.completedCount / category.totalCount) * 100
          : 0;
        const isComplete = category.completedCount === category.totalCount && category.totalCount > 0;
        const colorClass = categoryColors[category.color || "woodland"] || categoryColors.woodland;

        return (
          <AccordionItem
            key={category.id}
            value={category.id}
            className={cn(
              "border rounded-lg overflow-hidden transition-all",
              "data-[state=open]:shadow-card"
            )}
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 w-full">
                {/* Category icon */}
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 border",
                  colorClass
                )}>
                  {category.icon || "📚"}
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{category.name}</span>
                    {isComplete && (
                      <Badge className="bg-asparagus text-white text-xs">Complete</Badge>
                    )}
                  </div>
                  
                  {/* Progress bar & count */}
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={progressPercent} className="h-1.5 flex-1 max-w-32" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {category.completedCount}/{category.totalCount} lessons
                    </span>
                  </div>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-4 pb-4">
              {category.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {category.description}
                </p>
              )}
              
              <div className="grid gap-3 sm:grid-cols-2">
                {category.lessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    isCompleted={isLessonCompleted(lesson.id)}
                    onClick={() => onLessonClick(lesson)}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
