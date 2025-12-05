import { useState, useEffect } from "react";
import { LearnLesson, LearnCategory, QuizQuestion } from "@/hooks/useLearnContent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Lightbulb,
  Brain, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  Heart,
  Bookmark,
  Leaf,
  Apple,
  Recycle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface LearnReelCardProps {
  lesson: LearnLesson;
  category: LearnCategory | undefined;
  isActive: boolean;
  isCompleted: boolean;
  engagementProgress: number;
  onQuizComplete: (score: number) => void;
  isLiked: boolean;
  isSaved: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
}

// Beautiful gradient combinations
const cardThemes = {
  woodland: {
    gradient: "from-[#4a6741] via-[#5a7d50] to-[#6b8f5e]",
    accent: "#8FBC8F",
    glow: "shadow-[0_0_60px_-15px_rgba(74,103,65,0.5)]",
  },
  "pine-glade": {
    gradient: "from-[#5d7a4a] via-[#7a9a5a] to-[#8fb06a]",
    accent: "#98D982",
    glow: "shadow-[0_0_60px_-15px_rgba(122,154,90,0.5)]",
  },
  raffia: {
    gradient: "from-[#9a7b4f] via-[#c4a574] to-[#d4b584]",
    accent: "#DEB887",
    glow: "shadow-[0_0_60px_-15px_rgba(196,165,116,0.5)]",
  },
  asparagus: {
    gradient: "from-[#5e7a3d] via-[#7a9a4d] to-[#8aaa5d]",
    accent: "#87A96B",
    glow: "shadow-[0_0_60px_-15px_rgba(135,169,107,0.5)]",
  },
};

const categoryIcons: Record<string, typeof Leaf> = {
  'Food Safety': Apple,
  'Sustainable Living': Recycle,
  'Community Impact': Heart,
};

export function LearnReelCard({
  lesson,
  category,
  isActive,
  isCompleted,
  engagementProgress,
  onQuizComplete,
  isLiked,
  isSaved,
  onToggleLike,
  onToggleSave,
}: LearnReelCardProps) {
  const navigate = useNavigate();
  const theme = cardThemes[category?.color as keyof typeof cardThemes] || cardThemes.woodland;
  const CategoryIcon = categoryIcons[category?.name || ''] || Leaf;

  // Quiz state
  const [quizState, setQuizState] = useState<{
    currentIndex: number;
    answers: (number | null)[];
    showResult: boolean;
  }>({ currentIndex: 0, answers: [], showResult: false });

  // Parse quiz questions
  let quizQuestions: QuizQuestion[] = [];
  if (lesson.type === 'quiz' && lesson.content) {
    try {
      quizQuestions = JSON.parse(lesson.content);
    } catch (e) {
      console.error("Failed to parse quiz content:", e);
    }
  }

  const currentQuestion = quizQuestions[quizState.currentIndex];
  const hasAnswered = quizState.answers[quizState.currentIndex] != null;

  const handleQuizAnswer = (optionIndex: number) => {
    if (hasAnswered) return;
    const newAnswers = [...quizState.answers];
    newAnswers[quizState.currentIndex] = optionIndex;
    setQuizState(prev => ({ ...prev, answers: newAnswers }));
  };

  const handleNextQuestion = () => {
    if (quizState.currentIndex < quizQuestions.length - 1) {
      setQuizState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    } else {
      const correctCount = quizState.answers.filter(
        (answer, idx) => answer === quizQuestions[idx]?.correctIndex
      ).length;
      const score = Math.round((correctCount / quizQuestions.length) * 100);
      setQuizState(prev => ({ ...prev, showResult: true }));
      onQuizComplete(score);
    }
  };

  useEffect(() => {
    setQuizState({ currentIndex: 0, answers: [], showResult: false });
  }, [lesson.id]);

  // Parse content for article display
  const renderArticleContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Main heading
      if (trimmed.startsWith('# ')) {
        return null; // Skip, we use lesson.title
      }
      
      // Subheading
      if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        return (
          <motion.h3 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="text-xl font-semibold text-white mt-4 mb-2"
          >
            {trimmed.replace(/^#+\s/, '')}
          </motion.h3>
        );
      }
      
      // Highlight box (lines wrapped in **)
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="my-4 p-5 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20"
          >
            <p className="text-xl font-bold text-white text-center leading-relaxed">
              {trimmed.slice(2, -2)}
            </p>
          </motion.div>
        );
      }
      
      // Numbered list
      if (/^\d+\.\s/.test(trimmed)) {
        const num = trimmed.match(/^(\d+)\./)?.[1];
        const text = trimmed.replace(/^\d+\.\s+/, '');
        return (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-start gap-4 my-3"
          >
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {num}
            </span>
            <p className="text-lg text-white/90 leading-relaxed pt-1">
              {text.replace(/\*\*/g, '')}
            </p>
          </motion.div>
        );
      }
      
      // Bullet list
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-start gap-3 my-2"
          >
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-white/60 mt-2.5" />
            <p className="text-lg text-white/90 leading-relaxed">
              {trimmed.slice(2).replace(/\*\*/g, '')}
            </p>
          </motion.div>
        );
      }
      
      // Italic (emphasis)
      if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
        return (
          <motion.p 
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="text-lg italic text-white/80 my-4 text-center"
          >
            {trimmed.slice(1, -1)}
          </motion.p>
        );
      }
      
      // Regular paragraph with inline bold handling
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
      return (
        <motion.p 
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="text-lg text-white/90 leading-relaxed my-3"
        >
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <span key={i} className="font-bold text-white">
                  {part.slice(2, -2)}
                </span>
              );
            }
            return part;
          })}
        </motion.p>
      );
    });
  };

  return (
    <div className={cn(
      "relative w-full h-full rounded-[32px] overflow-hidden",
      "bg-gradient-to-br",
      theme.gradient,
      theme.glow
    )}>
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-black/10 blur-3xl" />
        <div className="absolute top-1/3 right-0 w-32 h-32 rounded-full bg-white/5 blur-xl" />
        
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2.5a2.5 2.5 0 015 0V16h15v2H25v2.5a2.5 2.5 0 01-5 0z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Progress bar at top */}
      {isActive && !isCompleted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-30">
          <motion.div 
            className="h-full bg-white/80"
            initial={{ width: 0 }}
            animate={{ width: `${engagementProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      {/* Category badge */}
      <div className="absolute top-6 left-6 z-20">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md"
        >
          <CategoryIcon className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-white tracking-wide">
            {category?.name || "Learn"}
          </span>
        </motion.div>
      </div>

      {/* Type indicator */}
      <div className="absolute top-6 right-6 z-20">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md",
            lesson.type === 'quiz' ? "bg-amber-500/30" : "bg-white/20"
          )}
        >
          {lesson.type === 'quiz' ? (
            <Brain className="w-4 h-4 text-white" />
          ) : (
            <Lightbulb className="w-4 h-4 text-white" />
          )}
          <span className="text-sm font-semibold text-white">
            {lesson.type === 'quiz' ? 'Quiz' : 'Tip'}
          </span>
        </motion.div>
      </div>

      {/* Completion badge */}
      {isCompleted && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-green-500/80 backdrop-blur-sm flex items-center justify-center"
        >
          <CheckCircle2 className="w-5 h-5 text-white" />
        </motion.div>
      )}

      {/* Action buttons - right side */}
      <div className="absolute right-4 bottom-1/3 z-30 flex flex-col gap-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onToggleLike(); }}
          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <Heart className={cn(
            "w-6 h-6 transition-all",
            isLiked ? "fill-red-500 text-red-500 scale-110" : "text-white"
          )} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <Bookmark className={cn(
            "w-6 h-6 transition-all",
            isSaved ? "fill-yellow-400 text-yellow-400 scale-110" : "text-white"
          )} />
        </motion.button>
      </div>

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col pt-20 pb-8 px-6">
        {/* Title */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white mb-6 leading-tight pr-16"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.2)' }}
        >
          {lesson.title}
        </motion.h2>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto scrollbar-hide pr-12">
          {/* ARTICLE CONTENT */}
          {lesson.type === 'article' && lesson.content && (
            <div className="space-y-1">
              {renderArticleContent(lesson.content)}
            </div>
          )}

          {/* QUIZ CONTENT */}
          {lesson.type === 'quiz' && quizQuestions.length > 0 && !quizState.showResult && (
            <div className="space-y-6">
              {/* Quiz progress */}
              <div className="flex gap-2">
                {quizQuestions.map((_, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "flex-1 h-1.5 rounded-full transition-all",
                      idx < quizState.currentIndex ? "bg-white" :
                      idx === quizState.currentIndex ? "bg-white/80" : "bg-white/30"
                    )}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={quizState.currentIndex}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="space-y-5"
                >
                  {/* Question */}
                  <h3 className="text-xl font-semibold text-white leading-relaxed">
                    {currentQuestion?.question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-3">
                    {currentQuestion?.options.map((option, idx) => {
                      const isSelected = quizState.answers[quizState.currentIndex] === idx;
                      const isCorrect = idx === currentQuestion.correctIndex;
                      const showResult = hasAnswered;

                      return (
                        <motion.button
                          key={idx}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleQuizAnswer(idx)}
                          disabled={hasAnswered}
                          className={cn(
                            "w-full p-4 rounded-2xl text-left transition-all duration-300",
                            "flex items-center gap-4 border-2",
                            !hasAnswered && "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40",
                            showResult && isCorrect && "bg-green-500/40 border-green-400/60",
                            showResult && isSelected && !isCorrect && "bg-red-500/40 border-red-400/60",
                            showResult && !isSelected && !isCorrect && "bg-white/5 border-white/10 opacity-50"
                          )}
                        >
                          <span className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0",
                            !hasAnswered && "bg-white/20 text-white",
                            showResult && isCorrect && "bg-green-500 text-white",
                            showResult && isSelected && !isCorrect && "bg-red-500 text-white"
                          )}>
                            {showResult && isCorrect ? "✓" : 
                             showResult && isSelected ? "✗" : 
                             String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-lg text-white font-medium">{option}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <AnimatePresence>
                    {hasAnswered && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20"
                      >
                        <p className="text-base text-white/90 leading-relaxed">
                          💡 {currentQuestion?.explanation}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Next button */}
                  {hasAnswered && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Button
                        onClick={handleNextQuestion}
                        className="w-full h-14 bg-white hover:bg-white/90 text-gray-900 font-bold text-lg rounded-2xl"
                      >
                        {quizState.currentIndex < quizQuestions.length - 1 ? "Continue" : "See Results"}
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Quiz Results */}
          {lesson.type === 'quiz' && quizState.showResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-6"
              >
                <Sparkles className="w-12 h-12 text-white" />
              </motion.div>
              <h3 className="text-3xl font-bold text-white mb-3">
                {quizState.answers.filter((a, i) => a === quizQuestions[i]?.correctIndex).length === quizQuestions.length 
                  ? "Perfect! 🎉" 
                  : "Great job!"}
              </h3>
              <p className="text-xl text-white/80 mb-6">
                {quizState.answers.filter((a, i) => a === quizQuestions[i]?.correctIndex).length} / {quizQuestions.length} correct
              </p>
              <div className="px-8 py-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                <span className="text-4xl font-bold text-white">
                  {Math.round((quizState.answers.filter((a, i) => a === quizQuestions[i]?.correctIndex).length / quizQuestions.length) * 100)}%
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* CTA Button for articles */}
        {lesson.type === 'article' && lesson.cta_type && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4"
          >
            <Button
              onClick={() => {
                const paths: Record<string, string> = {
                  triage: '/my-food',
                  donate: '/donate',
                  community: '/community',
                };
                navigate(paths[lesson.cta_type!] || '/');
              }}
              className="w-full h-14 bg-white/20 hover:bg-white/30 text-white font-bold text-lg rounded-2xl backdrop-blur-sm border border-white/30"
            >
              {lesson.cta_label || "Take Action"}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Points earned */}
        {engagementProgress >= 100 && !isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-center gap-3 py-3 px-6 rounded-full bg-white/20 backdrop-blur-sm mx-auto"
          >
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-lg font-bold text-white">+5 points!</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
