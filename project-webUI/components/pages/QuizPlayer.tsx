'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuizPlayerProps {
  questions: any[];
  onFinish: (score: number) => void;
}

export function QuizPlayer({ questions, onFinish }: QuizPlayerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  const handleAnswer = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    setIsAnswered(true);
    if (idx === currentQuestion.correct) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
    } else {
      onFinish(score);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
        <div 
          className="bg-blue-500 h-full transition-all duration-500" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-sm font-medium text-gray-500">
        <span>Question {currentIdx + 1} of {questions.length}</span>
        <span>Score: {score}</span>
      </div>

      <Card className="p-8 space-y-6 shadow-2xl border-t-4 border-t-blue-500">
        <h3 className="text-xl font-semibold text-gray-800 leading-relaxed">
          {currentQuestion.text}
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {currentQuestion.options.map((option: string, idx: number) => {
            let variant = "outline";
            if (isAnswered) {
              if (idx === currentQuestion.correct) variant = "bg-green-100 border-green-500 text-green-700";
              else if (idx === selectedIdx) variant = "bg-red-100 border-red-500 text-red-700";
              else variant = "opacity-50";
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={`p-4 text-left rounded-xl border-2 transition-all font-medium ${
                  variant === "outline" ? "hover:border-blue-400 hover:bg-blue-50" : variant
                } ${selectedIdx === idx ? "ring-2 ring-blue-300" : ""}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg animate-in slide-in-from-bottom-2">
            <p className="text-sm font-bold text-blue-800 mb-1">Giải thích:</p>
            <p className="text-sm text-blue-700">{currentQuestion.explanation}</p>
            <Button onClick={handleNext} className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
              {currentIdx === questions.length - 1 ? "Xem kết quả" : "Câu tiếp theo →"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}