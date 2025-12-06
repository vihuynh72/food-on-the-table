import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LearnLesson, LearnCategory } from "@/hooks/useLearnContent";
import { LearnReelCard } from "./LearnReelCard";
import { cn } from "@/lib/utils";

interface LearnReelCarouselProps {
  lessons: LearnLesson[];
  categories: LearnCategory[];
  completedLessonIds: Set<string>;
  onLessonComplete: (lessonId: string, quizScore?: number) => void;
  likedLessonIds: Set<string>;
  savedLessonIds: Set<string>;
  onToggleLike: (lessonId: string) => void;
  onToggleSave: (lessonId: string) => void;
}

const ENGAGEMENT_TIME_MS = 15000;
const SWIPE_THRESHOLD = 50;

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function LearnReelCarousel({
  lessons,
  categories,
  completedLessonIds,
  onLessonComplete,
  likedLessonIds,
  savedLessonIds,
  onToggleLike,
  onToggleSave,
}: LearnReelCarouselProps) {
  const shuffledLessons = useMemo(() => shuffleArray(lessons), [lessons]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [engagementProgress, setEngagementProgress] = useState(0);
  const [direction, setDirection] = useState(0);
  
  const engagementTimerRef = useRef<NodeJS.Timeout | null>(null);
  const engagementStartRef = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentLesson = shuffledLessons[currentIndex];
  const currentCategory = categories.find(c => c.id === currentLesson?.category_id);
  const isCurrentCompleted = currentLesson ? completedLessonIds.has(currentLesson.id) : false;

  const startEngagementTimer = useCallback(() => {
    if (engagementTimerRef.current) clearTimeout(engagementTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    setEngagementProgress(0);
    engagementStartRef.current = Date.now();

    if (isCurrentCompleted || !currentLesson) return;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - engagementStartRef.current;
      const progress = Math.min((elapsed / ENGAGEMENT_TIME_MS) * 100, 100);
      setEngagementProgress(progress);
      if (progress >= 100 && progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }, 100);

    engagementTimerRef.current = setTimeout(() => {
      if (currentLesson && !completedLessonIds.has(currentLesson.id) && currentLesson.type !== 'quiz') {
        onLessonComplete(currentLesson.id);
      }
    }, ENGAGEMENT_TIME_MS);
  }, [currentLesson, isCurrentCompleted, completedLessonIds, onLessonComplete]);

  useEffect(() => {
    startEngagementTimer();
    return () => {
      if (engagementTimerRef.current) clearTimeout(engagementTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, startEngagementTimer]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < shuffledLessons.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, shuffledLessons.length]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x > SWIPE_THRESHOLD || velocity.x > 500) goToPrevious();
    else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -500) goToNext();
  }, [goToPrevious, goToNext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      else if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  const handleQuizComplete = useCallback((score: number) => {
    if (currentLesson) onLessonComplete(currentLesson.id, score);
  }, [currentLesson, onLessonComplete]);

  if (shuffledLessons.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-lg">No lessons available yet</p>
      </div>
    );
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9,
      rotateY: direction > 0 ? 15 : -15,
    }),
    center: { x: 0, opacity: 1, scale: 1, rotateY: 0 },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9,
      rotateY: direction < 0 ? 15 : -15,
    }),
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Left Navigation - positioned closer to the card */}
      <button
        onClick={goToPrevious}
        disabled={currentIndex === 0}
        className={cn(
          "absolute z-40 p-3 rounded-full",
          "bg-white/90 shadow-lg backdrop-blur-sm",
          "hover:bg-white hover:scale-110 active:scale-95",
          "transition-all duration-200",
          "disabled:opacity-0 disabled:pointer-events-none",
          "hidden md:flex items-center justify-center",
          "left-[calc(50%-250px)] lg:left-[calc(50%-260px)]"
        )}
      >
        <ChevronLeft className="w-6 h-6 text-woodland" />
      </button>

      {/* Card Container */}
      <div className="relative w-full max-w-[420px] h-[75vh] max-h-[700px] perspective-1000">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 350, damping: 35 },
              opacity: { duration: 0.25 },
              scale: { duration: 0.3 },
              rotateY: { duration: 0.3 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <LearnReelCard
              lesson={currentLesson}
              category={currentCategory}
              isActive={true}
              isCompleted={isCurrentCompleted}
              engagementProgress={engagementProgress}
              onQuizComplete={handleQuizComplete}
              isLiked={likedLessonIds.has(currentLesson.id)}
              isSaved={savedLessonIds.has(currentLesson.id)}
              onToggleLike={() => onToggleLike(currentLesson.id)}
              onToggleSave={() => onToggleSave(currentLesson.id)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right Navigation - positioned closer to the card */}
      <button
        onClick={goToNext}
        disabled={currentIndex === shuffledLessons.length - 1}
        className={cn(
          "absolute z-40 p-3 rounded-full",
          "bg-white/90 shadow-lg backdrop-blur-sm",
          "hover:bg-white hover:scale-110 active:scale-95",
          "transition-all duration-200",
          "disabled:opacity-0 disabled:pointer-events-none",
          "hidden md:flex items-center justify-center",
          "right-[calc(50%-250px)] lg:right-[calc(50%-260px)]"
        )}
      >
        <ChevronRight className="w-6 h-6 text-woodland" />
      </button>

      {/* Mobile swipe hint */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden"
      >
        <p className="text-sm text-muted-foreground/70 font-medium">
          Swipe to explore
        </p>
      </motion.div>
    </div>
  );
}
