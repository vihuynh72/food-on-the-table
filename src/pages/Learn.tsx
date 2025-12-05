import { useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { useLearnContent } from "@/hooks/useLearnContent";
import { LearnReelCarousel } from "@/components/learn/LearnReelCarousel";
import { Skeleton } from "@/components/ui/skeleton";

export default function Learn() {
  const {
    categories,
    lessons,
    isLoading,
    error,
    completeLesson,
    progress,
  } = useLearnContent();

  // Create a Set of completed lesson IDs for efficient lookup
  const completedLessonIds = useMemo(() => {
    return new Set(progress.map(p => p.lesson_id));
  }, [progress]);

  // Handle lesson completion from carousel
  const handleLessonComplete = (lessonId: string, quizScore?: number) => {
    completeLesson({
      lessonId,
      quizScore,
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load learning content. Please try again later.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-pine-glade/10 flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-2 py-2 flex flex-col overflow-hidden">
        {/* Main Carousel Area - Full height */}
        <div className="flex-1 min-h-0 relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-full max-w-lg space-y-4">
                <Skeleton className="h-[60vh] w-full rounded-2xl" />
                <div className="flex justify-center gap-2">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="w-6 h-2 rounded-full" />
                  <Skeleton className="w-2 h-2 rounded-full" />
                </div>
              </div>
            </div>
          ) : lessons.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No lessons yet.</p>
            </div>
          ) : (
            <LearnReelCarousel
              lessons={lessons}
              categories={categories}
              completedLessonIds={completedLessonIds}
              onLessonComplete={handleLessonComplete}
            />
          )}
        </div>
      </main>
    </div>
  );
}