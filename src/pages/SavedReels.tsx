import { useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { useLearnContent } from "@/hooks/useLearnContent";
import { LearnReelCard } from "@/components/learn/LearnReelCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bookmark, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SavedReels() {
  const navigate = useNavigate();
  const {
    categories,
    lessons,
    isLoading,
    error,
    completeLesson,
    progress,
    likedLessonIds,
    savedLessonIds,
    toggleLike,
    toggleSave,
  } = useLearnContent();

  const completedLessonIds = useMemo(() => {
    return new Set(progress.map(p => p.lesson_id));
  }, [progress]);

  const savedLessons = useMemo(() => {
    return lessons.filter(lesson => savedLessonIds.includes(lesson.id));
  }, [lessons, savedLessonIds]);

  const likedLessons = useMemo(() => {
    return lessons.filter(lesson => likedLessonIds.includes(lesson.id));
  }, [lessons, likedLessonIds]);

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
            <p className="text-destructive">Failed to load content. Please try again later.</p>
          </div>
        </main>
      </div>
    );
  }

  const renderLessonGrid = (lessonList: typeof lessons, emptyMessage: string, emptyIcon: React.ReactNode) => {
    if (lessonList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          {emptyIcon}
          <p className="mt-4 text-center">{emptyMessage}</p>
          <Button
            variant="outline"
            onClick={() => navigate("/learn")}
            className="mt-4"
          >
            Browse Lessons
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lessonList.map((lesson, index) => {
          const category = categories.find(c => c.id === lesson.category_id);
          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="h-[400px] rounded-2xl overflow-hidden shadow-lg"
            >
              <LearnReelCard
                lesson={lesson}
                category={category}
                isActive={false}
                isCompleted={completedLessonIds.has(lesson.id)}
                engagementProgress={100}
                onQuizComplete={(score) => handleLessonComplete(lesson.id, score)}
                isLiked={likedLessonIds.includes(lesson.id)}
                isSaved={savedLessonIds.includes(lesson.id)}
                onToggleLike={() => toggleLike(lesson.id)}
                onToggleSave={() => toggleSave(lesson.id)}
              />
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-pine-glade/10">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/learn")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">My Collection</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[400px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="saved" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                Saved ({savedLessons.length})
              </TabsTrigger>
              <TabsTrigger value="liked" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Liked ({likedLessons.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="saved">
              {renderLessonGrid(
                savedLessons,
                "No saved lessons yet. Bookmark lessons to find them here later!",
                <Bookmark className="w-12 h-12 text-muted-foreground/50" />
              )}
            </TabsContent>
            
            <TabsContent value="liked">
              {renderLessonGrid(
                likedLessons,
                "No liked lessons yet. Heart your favorite lessons!",
                <Heart className="w-12 h-12 text-muted-foreground/50" />
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
