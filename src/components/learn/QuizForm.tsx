import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import { QuizQuestion } from "@/hooks/useLearnContent";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface QuizFormProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

export function QuizForm({ questions, onComplete }: QuizFormProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [animatingNext, setAnimatingNext] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;

  // Calculate score
  const correctAnswers = answers.filter((answer, idx) => answer === questions[idx].correctIndex).length;
  const score = Math.round((correctAnswers / questions.length) * 100);

  const handleSelectAnswer = (optionIndex: number) => {
    if (answerState !== 'unanswered') return;
    
    setSelectedAnswer(optionIndex);
    const isCorrect = optionIndex === currentQuestion.correctIndex;
    setAnswerState(isCorrect ? 'correct' : 'incorrect');
    
    // Update answers array
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      setShowResults(true);
      onComplete(score);
    } else {
      setAnimatingNext(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setAnswerState('unanswered');
        setAnimatingNext(false);
      }, 200);
    }
  }, [isLastQuestion, score, onComplete]);

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswerState('unanswered');
    setAnswers(new Array(questions.length).fill(null));
    setShowResults(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showResults) return;
      
      if (answerState === 'unanswered') {
        // Number keys 1-4 to select answer
        const num = parseInt(e.key);
        if (num >= 1 && num <= currentQuestion.options.length) {
          handleSelectAnswer(num - 1);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        // Enter/Space to continue
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answerState, currentIndex, currentQuestion.options.length, handleNext, showResults]);

  if (showResults) {
    const isPerfect = score === 100;
    const isGood = score >= 80;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className={cn(
          "w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6",
          isPerfect ? "bg-gradient-to-br from-yellow-400 to-amber-500" :
          isGood ? "bg-gradient-to-br from-asparagus to-woodland" :
          "bg-gradient-to-br from-desert-sand to-raffia"
        )}>
          <Trophy className={cn(
            "w-12 h-12",
            isPerfect ? "text-white" : isGood ? "text-white" : "text-woodland"
          )} />
        </div>
        
        <h3 className="text-2xl font-bold mb-2">
          {isPerfect ? "Perfect Score! 🎉" : isGood ? "Great Job! 🌟" : "Good Effort! 💪"}
        </h3>
        
        <p className="text-muted-foreground mb-4">
          You got {correctAnswers} out of {questions.length} questions correct
        </p>
        
        <div className="flex items-center justify-center gap-2 mb-6">
          <Badge variant="outline" className="text-lg px-4 py-1">
            {score}%
          </Badge>
          <Badge className={cn(
            "text-lg px-4 py-1",
            isPerfect ? "bg-yellow-500" : isGood ? "bg-asparagus" : "bg-desert-sand text-woodland"
          )}>
            +{isPerfect ? 10 : 3} points
          </Badge>
        </div>
        
        <Button onClick={handleRetry} variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: animatingNext ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: animatingNext ? -20 : 20 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-xl font-semibold mb-6">{currentQuestion.question}</h3>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectAnswer = idx === currentQuestion.correctIndex;
              const showAsCorrect = answerState !== 'unanswered' && isCorrectAnswer;
              const showAsIncorrect = answerState === 'incorrect' && isSelected;

              return (
                <motion.div
                  key={idx}
                  whileHover={answerState === 'unanswered' ? { scale: 1.01 } : undefined}
                  whileTap={answerState === 'unanswered' ? { scale: 0.99 } : undefined}
                >
                  <Card
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      answerState === 'unanswered' && "hover:border-woodland/50 hover:shadow-sm",
                      isSelected && answerState === 'unanswered' && "border-woodland ring-2 ring-woodland/20",
                      showAsCorrect && "border-green-500 bg-green-50 dark:bg-green-950/20",
                      showAsIncorrect && "border-red-500 bg-red-50 dark:bg-red-950/20",
                    )}
                    onClick={() => handleSelectAnswer(idx)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium",
                        answerState === 'unanswered' && "bg-muted text-muted-foreground",
                        showAsCorrect && "bg-green-500 text-white",
                        showAsIncorrect && "bg-red-500 text-white",
                      )}>
                        {showAsCorrect ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : showAsIncorrect ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span className={cn(
                        "flex-1",
                        showAsCorrect && "text-green-700 dark:text-green-300 font-medium",
                        showAsIncorrect && "text-red-700 dark:text-red-300",
                      )}>
                        {option}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Explanation (shown after answering) */}
          <AnimatePresence>
            {answerState !== 'unanswered' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <Card className={cn(
                  "border-l-4",
                  answerState === 'correct' ? "border-l-green-500 bg-green-50/50 dark:bg-green-950/10" : "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10"
                )}>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {answerState === 'correct' ? "Correct! " : "Not quite. "}
                      </span>
                      {currentQuestion.explanation}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Continue button */}
      <AnimatePresence>
        {answerState !== 'unanswered' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex justify-end"
          >
            <Button onClick={handleNext} className="gap-2">
              {isLastQuestion ? "See Results" : "Next Question"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
