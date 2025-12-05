import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, HelpCircle, CheckCircle2 } from "lucide-react";
import { LearnLesson } from "@/hooks/useLearnContent";
import { cn } from "@/lib/utils";

interface LessonCardProps {
  lesson: LearnLesson;
  isCompleted: boolean;
  onClick: () => void;
}

const typeIcons = {
  article: FileText,
  quiz: HelpCircle,
};

const typeLabels = {
  article: "Article",
  quiz: "Quiz",
};

const typeColors = {
  article: "bg-asparagus/10 text-asparagus border-asparagus/20",
  quiz: "bg-desert-sand/30 text-woodland border-desert-sand/50",
};

export function LessonCard({ lesson, isCompleted, onClick }: LessonCardProps) {
  const TypeIcon = typeIcons[lesson.type];

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-card-hover transition-all duration-200 group relative overflow-hidden",
        isCompleted && "ring-2 ring-asparagus/30 bg-pine-glade/10"
      )}
      onClick={onClick}
    >
      {isCompleted && (
        <div className="absolute top-2 right-2 z-10">
          <CheckCircle2 className="w-5 h-5 text-asparagus fill-asparagus/20" />
        </div>
      )}
      
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0",
            "bg-gradient-to-br from-pine-glade/50 to-raffia/50"
          )}>
            {lesson.thumbnail || "📚"}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-woodland transition-colors">
              {lesson.title}
            </h3>
            
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className={cn("text-xs", typeColors[lesson.type])}>
                <TypeIcon className="w-3 h-3 mr-1" />
                {typeLabels[lesson.type]}
              </Badge>
              
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lesson.duration} min
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {lesson.summary}
        </p>
        
        {lesson.tags && lesson.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lesson.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs bg-muted/50 font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
