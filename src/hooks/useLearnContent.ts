import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { trackImpactEvent } from "@/lib/impact";
import { toast } from "@/hooks/use-toast";

// Types for Learn content
export interface LearnCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string | null;
}

export interface LearnLesson {
  id: string;
  category_id: string;
  title: string;
  type: 'article' | 'quiz';
  duration: number;
  summary: string | null;
  content: string | null;
  thumbnail: string | null;
  tags: string[] | null;
  cta_type: string | null;
  cta_label: string | null;
  sort_order: number;
  created_at: string | null;
}

export interface LearnUserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string | null;
  quiz_score: number | null;
  time_spent_seconds: number | null;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CategoryWithProgress extends LearnCategory {
  lessons: LearnLesson[];
  completedCount: number;
  totalCount: number;
}

export function useLearnContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all categories
  const categoriesQuery = useQuery({
    queryKey: ["learn_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learn_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as LearnCategory[];
    },
  });

  // Fetch all lessons
  const lessonsQuery = useQuery({
    queryKey: ["learn_lessons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learn_lessons")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as LearnLesson[];
    },
  });

  // Fetch user progress
  const progressQuery = useQuery({
    queryKey: ["learn_user_progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("learn_user_progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as LearnUserProgress[];
    },
    enabled: !!user,
  });

  // Fetch user likes
  const likesQuery = useQuery({
    queryKey: ["learn_user_likes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("learn_user_likes")
        .select("lesson_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((l: { lesson_id: string }) => l.lesson_id);
    },
    enabled: !!user,
  });

  // Fetch user saves
  const savesQuery = useQuery({
    queryKey: ["learn_user_saves", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("learn_user_saves")
        .select("lesson_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((s: { lesson_id: string }) => s.lesson_id);
    },
    enabled: !!user,
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) throw new Error("Not authenticated");
      const isLiked = likesQuery.data?.includes(lessonId);

      if (isLiked) {
        const { error } = await supabase
          .from("learn_user_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("learn_user_likes")
          .insert({ user_id: user.id, lesson_id: lessonId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learn_user_likes"] });
    },
  });

  // Toggle save mutation
  const toggleSaveMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) throw new Error("Not authenticated");
      const isSaved = savesQuery.data?.includes(lessonId);

      if (isSaved) {
        const { error } = await supabase
          .from("learn_user_saves")
          .delete()
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("learn_user_saves")
          .insert({ user_id: user.id, lesson_id: lessonId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learn_user_saves"] });
    },
  });

  // Combine categories with lessons and progress
  const categoriesWithProgress: CategoryWithProgress[] = (categoriesQuery.data || []).map(category => {
    const categoryLessons = (lessonsQuery.data || []).filter(l => l.category_id === category.id);
    const completedLessons = categoryLessons.filter(lesson =>
      (progressQuery.data || []).some(p => p.lesson_id === lesson.id)
    );
    return {
      ...category,
      lessons: categoryLessons,
      completedCount: completedLessons.length,
      totalCount: categoryLessons.length,
    };
  });

  // Check if a lesson is completed
  const isLessonCompleted = (lessonId: string): boolean => {
    return (progressQuery.data || []).some(p => p.lesson_id === lessonId);
  };

  // Get progress for a specific lesson
  const getLessonProgress = (lessonId: string): LearnUserProgress | undefined => {
    return (progressQuery.data || []).find(p => p.lesson_id === lessonId);
  };

  // Mark lesson as complete
  const completeLessonMutation = useMutation({
    mutationFn: async ({ 
      lessonId, 
      quizScore, 
      timeSpentSeconds 
    }: { 
      lessonId: string; 
      quizScore?: number; 
      timeSpentSeconds?: number 
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Check if already completed
      const existing = (progressQuery.data || []).find(p => p.lesson_id === lessonId);
      if (existing) {
        // Update existing progress if quiz score is higher
        if (quizScore !== undefined && (existing.quiz_score === null || quizScore > existing.quiz_score)) {
          const { error } = await supabase
            .from("learn_user_progress")
            .update({ quiz_score: quizScore })
            .eq("id", existing.id);
          if (error) throw error;
        }
        return existing;
      }

      // Insert new progress record
      const { data, error } = await supabase
        .from("learn_user_progress")
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          quiz_score: quizScore ?? null,
          time_spent_seconds: timeSpentSeconds ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      // Award impact points
      const lesson = (lessonsQuery.data || []).find(l => l.id === lessonId);
      const isQuiz = lesson?.type === 'quiz';
      const isPerfectScore = quizScore === 100;

      if (isQuiz) {
        await trackImpactEvent({
          userId: user.id,
          eventType: isPerfectScore ? 'learn_quiz_perfect' : 'learn_quiz_completed',
          sourceTable: 'learn_lessons',
          sourceId: lessonId,
          metadata: { quiz_score: quizScore, lesson_title: lesson?.title },
        });
      } else {
        await trackImpactEvent({
          userId: user.id,
          eventType: 'learn_lesson_completed',
          sourceTable: 'learn_lessons',
          sourceId: lessonId,
          metadata: { lesson_type: lesson?.type, lesson_title: lesson?.title },
        });
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["learn_user_progress"] });
      queryClient.invalidateQueries({ queryKey: ["impact_user_totals"] });
      
      const lesson = (lessonsQuery.data || []).find(l => l.id === variables.lessonId);
      const points = lesson?.type === 'quiz' 
        ? (variables.quizScore === 100 ? 10 : 3)
        : 5;
      
      toast({
        title: "Lesson Completed! 🎉",
        description: `You earned +${points} Impact points!`,
      });
    },
    onError: (error) => {
      console.error("Error completing lesson:", error);
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get overall progress stats
  const overallProgress = {
    totalLessons: lessonsQuery.data?.length || 0,
    completedLessons: progressQuery.data?.length || 0,
    percentComplete: lessonsQuery.data?.length 
      ? Math.round(((progressQuery.data?.length || 0) / lessonsQuery.data.length) * 100)
      : 0,
  };

  return {
    categories: categoriesQuery.data || [],
    lessons: lessonsQuery.data || [],
    progress: progressQuery.data || [],
    categoriesWithProgress,
    // Only check loading for public content (categories/lessons), not auth-gated queries
    isLoading: categoriesQuery.isLoading || lessonsQuery.isLoading,
    error: categoriesQuery.error || lessonsQuery.error,
    isLessonCompleted,
    getLessonProgress,
    completeLesson: completeLessonMutation.mutate,
    isCompletingLesson: completeLessonMutation.isPending,
    overallProgress,
    likedLessonIds: likesQuery.data || [],
    savedLessonIds: savesQuery.data || [],
    toggleLike: toggleLikeMutation.mutate,
    toggleSave: toggleSaveMutation.mutate,
  };
}
