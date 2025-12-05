import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LearnLesson, LearnCategory } from "@/hooks/useLearnContent";
import { LearnReelCard } from "./LearnReelCard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LearnReelCarouselProps {
  lessons: LearnLesson[];
  categories: LearnCategory[];
  completedLessonIds: Set<string>;
  onLessonComplete: (lessonId: string, quizScore?: number) => void;
}

const ENGAGEMENT_TIME_MS = 15000; // 15 seconds
const SWIPE_THRESHOLD = 50;

// Shuffle array utility
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
}: LearnReelCarouselProps) {
  // Shuffle lessons once on mount
  const shuffledLessons = useMemo(() => shuffleArray(lessons), [lessons]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [engagementProgress, setEngagementProgress] = useState(0);
  const [hasEarnedPoints, setHasEarnedPoints] = useState(false);
  const [direction, setDirection] = useState(0);
  
  const engagementTimerRef = useRef<NodeJS.Timeout | null>(null);
  const engagementStartRef = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentLesson = shuffledLessons[currentIndex];
  const currentCategory = categories.find(c => c.id === currentLesson?.category_id);
  const isCurrentCompleted = currentLesson ? completedLessonIds.has(currentLesson.id) : false;

  // Start engagement timer
  const startEngagementTimer = useCallback(() => {
    // Clear any existing timers
    if (engagementTimerRef.current) {
      clearTimeout(engagementTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Reset progress
    setEngagementProgress(0);
    setHasEarnedPoints(false);
    engagementStartRef.current = Date.now();

    // Don't start timer if already completed
    if (isCurrentCompleted || !currentLesson) return;

    // Progress update interval
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - engagementStartRef.current;
      const progress = Math.min((elapsed / ENGAGEMENT_TIME_MS) * 100, 100);
      setEngagementProgress(progress);
      
      if (progress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
    }, 100);

    // Award points after engagement time
    engagementTimerRef.current = setTimeout(() => {
      if (currentLesson && !completedLessonIds.has(currentLesson.id)) {
        setHasEarnedPoints(true);
        // For non-quiz lessons, auto-complete after 15s
        if (currentLesson.type !== 'quiz') {
          onLessonComplete(currentLesson.id);
        }
      }
    }, ENGAGEMENT_TIME_MS);
  }, [currentLesson, isCurrentCompleted, completedLessonIds, onLessonComplete]);

  // Reset and restart timer when slide changes
  useEffect(() => {
    startEngagementTimer();

    return () => {
      if (engagementTimerRef.current) {
        clearTimeout(engagementTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentIndex, startEngagementTimer]);

  // Navigation handlers
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

  // Swipe handler
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    
    if (offset.x > SWIPE_THRESHOLD || velocity.x > 500) {
      goToPrevious();
    } else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -500) {
      goToNext();
    }
  }, [goToPrevious, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Quiz completion handler
  const handleQuizComplete = useCallback((score: number) => {
    if (currentLesson) {
      onLessonComplete(currentLesson.id, score);
    }
  }, [currentLesson, onLessonComplete]);

  if (shuffledLessons.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No lessons available
      </div>
    );
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Carousel Container */}
      <div className="relative w-full max-w-lg h-[70vh] md:h-[75vh]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <LearnReelCard
              lesson={currentLesson}
              category={currentCategory}
              isActive={true}
              isCompleted={isCurrentCompleted}
              engagementProgress={engagementProgress}
              onQuizComplete={handleQuizComplete}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-30",
            "w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            "hidden md:flex"
          )}
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          disabled={currentIndex === shuffledLessons.length - 1}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-30",
            "w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            "hidden md:flex"
          )}
        >
          <ArrowRight className="w-5 h-5 text-gray-700" />
        </Button>
      </div>

      {/* Swipe hint for mobile */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden">
        <p className="text-xs text-muted-foreground animate-pulse">
          ← Swipe to navigate →
        </p>
      </div>
    </div>
  );
}
