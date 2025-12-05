import { useState, useRef, useEffect, useCallback } from "react";
import { LearnLesson, LearnCategory, QuizQuestion } from "@/hooks/useLearnContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Sparkles,
  Gift,
  Users,
  Utensils
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

interface LearnReelCardProps {
  lesson: LearnLesson;
  category: LearnCategory | undefined;
  isActive: boolean;
  isCompleted: boolean;
  engagementProgress: number; // 0-100
  onQuizComplete: (score: number) => void;
}

const typeIcons = {
  article: FileText,
  quiz: HelpCircle,
};

const categoryGradients: Record<string, string> = {
  woodland: "from-woodland/90 via-woodland/70 to-woodland/50",
  asparagus: "from-asparagus/90 via-asparagus/70 to-asparagus/50",
  "pine-glade": "from-[#7a9a5a]/90 via-[#7a9a5a]/70 to-[#7a9a5a]/50",
  raffia: "from-[#c4a574]/90 via-[#c4a574]/70 to-[#c4a574]/50",
  "desert-sand": "from-[#d4a574]/90 via-[#d4a574]/70 to-[#d4a574]/50",
};

const ctaConfig = {
  triage: { icon: Utensils, label: "Start Triage Quiz", path: "/my-food" },
  donate: { icon: Gift, label: "Find Donation Centers", path: "/donate" },
  community: { icon: Users, label: "Visit Community", path: "/community" },
};

export function LearnReelCard({
  lesson,
  category,
  isActive,
  isCompleted,
  engagementProgress,
  onQuizComplete,
}: LearnReelCardProps) {
  const navigate = useNavigate();
  const TypeIcon = typeIcons[lesson.type];
  const gradient = categoryGradients[category?.color || "woodland"] || categoryGradients.woodland;
  const ctaInfo = lesson.cta_type ? ctaConfig[lesson.cta_type as keyof typeof ctaConfig] : null;

  // Quiz state
  const [quizState, setQuizState] = useState<{
    currentIndex: number;
    answers: (number | null)[];
    showResult: boolean;
  }>({ currentIndex: 0, answers: [], showResult: false });

  // Parse quiz questions if quiz type
  let quizQuestions: QuizQuestion[] = [];
  if (lesson.type === 'quiz' && lesson.content) {
    try {
      quizQuestions = JSON.parse(lesson.content);
    } catch (e) {
      console.error("Failed to parse quiz content:", e);
    }
  }

  const currentQuestion = quizQuestions[quizState.currentIndex];
  const hasAnswered = quizState.answers[quizState.currentIndex] !== undefined && quizState.answers[quizState.currentIndex] !== null;

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
      // Calculate score and show results
      const correctCount = quizState.answers.filter(
        (answer, idx) => answer === quizQuestions[idx]?.correctIndex
      ).length;
      const score = Math.round((correctCount / quizQuestions.length) * 100);
      setQuizState(prev => ({ ...prev, showResult: true }));
      onQuizComplete(score);
    }
  };

  const handleCtaClick = () => {
    if (ctaInfo) {
      navigate(ctaInfo.path);
    }
  };

  // Reset quiz when lesson changes
  useEffect(() => {
    setQuizState({ currentIndex: 0, answers: [], showResult: false });
  }, [lesson.id]);

  return (
    <div className={cn(
      "relative w-full h-full rounded-2xl overflow-hidden",
      "bg-gradient-to-br",
      gradient
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Engagement Timer Ring */}
      {isActive && !isCompleted && engagementProgress < 100 && (
        <div className="absolute top-4 right-4 z-20">
          <div className="relative w-10 h-10">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                strokeWidth="3"
                stroke="rgba(255,255,255,0.2)"
                fill="none"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                strokeWidth="3"
                stroke="white"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${engagementProgress} 100`}
                className="transition-all duration-200"
              />
            </svg>
            <Clock className="absolute inset-0 m-auto w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Completed checkmark */}
      {isCompleted && (
        <div className="absolute top-4 right-4 z-20">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0">
          {category?.icon} {category?.name}
        </Badge>
        <Badge variant="outline" className="bg-white/10 backdrop-blur-sm text-white border-white/20">
          <TypeIcon className="w-3 h-3 mr-1" />
          {lesson.type === 'article' ? 'Tip' : 'Quiz'}
        </Badge>
      </div>

      {/* Main Content Area */}
      <div className="absolute inset-0 flex flex-col pt-16 pb-4 px-4 overflow-hidden">
        {/* Title */}
        <div className="mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg leading-tight">
            {lesson.title}
          </h2>
        </div>

        {/* Content based on type */}
        <div className="flex-1 overflow-auto scrollbar-hide">
          {lesson.type === 'article' && lesson.content && (
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold mt-4 mb-2 text-white">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-semibold mt-3 mb-1 text-white">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-3 text-white/90 leading-relaxed text-sm">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-1 mb-3 ml-4">{children}</ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-white/90 text-sm">{children}</li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-white/50 pl-3 italic my-3 text-white/80 bg-white/5 py-2 rounded-r text-sm">
                        {children}
                      </blockquote>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-white">{children}</strong>
                    ),
                  }}
                >
                  {lesson.content}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {lesson.type === 'quiz' && quizQuestions.length > 0 && !quizState.showResult && (
            <div className="space-y-4">
              {/* Quiz progress */}
              <div className="flex items-center gap-2">
                <Progress 
                  value={(quizState.currentIndex / quizQuestions.length) * 100} 
                  className="h-1.5 flex-1 bg-white/20" 
                />
                <span className="text-white/80 text-xs">
                  {quizState.currentIndex + 1}/{quizQuestions.length}
                </span>
              </div>

              {/* Question */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={quizState.currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-white">
                    {currentQuestion?.question}
                  </h3>

                  <div className="space-y-2">
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
                            "w-full p-3 rounded-xl text-left transition-all",
                            "flex items-center gap-3",
                            !hasAnswered && "bg-white/10 hover:bg-white/20 text-white",
                            showResult && isCorrect && "bg-green-500/80 text-white",
                            showResult && isSelected && !isCorrect && "bg-red-500/80 text-white",
                            showResult && !isSelected && !isCorrect && "bg-white/10 text-white/60"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                            !hasAnswered && "bg-white/20",
                            showResult && isCorrect && "bg-white/30",
                            showResult && isSelected && !isCorrect && "bg-white/30"
                          )}>
                            {showResult && isCorrect ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : showResult && isSelected ? (
                              "✗"
                            ) : (
                              String.fromCharCode(65 + idx)
                            )}
                          </div>
                          <span className="text-sm">{option}</span>
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
                        className="bg-white/10 rounded-xl p-3"
                      >
                        <p className="text-sm text-white/90">
                          {currentQuestion?.explanation}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Next button */}
                  {hasAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Button
                        onClick={handleNextQuestion}
                        className="w-full bg-white text-black hover:bg-white/90"
                      >
                        {quizState.currentIndex < quizQuestions.length - 1 ? "Next Question" : "See Results"}
                        <ArrowRight className="w-4 h-4 ml-2" />
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h3>
              <p className="text-white/80 mb-4">
                You got {quizState.answers.filter((a, i) => a === quizQuestions[i]?.correctIndex).length} out of {quizQuestions.length} correct
              </p>
              <Badge className="bg-white/20 text-white text-lg px-4 py-1">
                {Math.round((quizState.answers.filter((a, i) => a === quizQuestions[i]?.correctIndex).length / quizQuestions.length) * 100)}%
              </Badge>
            </motion.div>
          )}
        </div>

        {/* CTA Button */}
        {ctaInfo && lesson.type !== 'quiz' && (
          <div className="mt-4">
            <Button
              onClick={handleCtaClick}
              variant="secondary"
              className="w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
            >
              <ctaInfo.icon className="w-4 h-4 mr-2" />
              {lesson.cta_label || ctaInfo.label}
            </Button>
          </div>
        )}

        {/* Engagement indicator */}
        {engagementProgress >= 100 && !isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-center gap-2 text-white bg-white/20 rounded-full py-2 px-4 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">+5 points earned!</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
