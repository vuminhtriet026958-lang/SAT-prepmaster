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
      {/* Progress Bar - Nền tối hơn trong Dark Mode */}
      <div className="w-full bg-gray-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden transition-colors">
        <div 
          className="bg-blue-500 h-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-sm font-semibold text-gray-500 dark:text-slate-400">
        <span>Question {currentIdx + 1} <span className="text-gray-400 dark:text-slate-600">/ {questions.length}</span></span>
        <span className="text-blue-600 dark:text-blue-400">Current Score: {score}</span>
      </div>

      <Card className="p-8 space-y-6 shadow-2xl border-t-4 border-t-blue-500 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 transition-all">
        {/* Nội dung câu hỏi */}
        <h3 className="text-xl font-bold text-gray-800 dark:text-white leading-relaxed">
          {currentQuestion.text}
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {currentQuestion.options.map((option: string, idx: number) => {
            const isCorrect = idx === currentQuestion.correct;
            const isSelected = idx === selectedIdx;
            
            // Logic màu sắc thông minh
            let buttonClass = "border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-slate-300";
            
            if (isAnswered) {
              if (isCorrect) {
                buttonClass = "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold";
              } else if (isSelected) {
                buttonClass = "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 opacity-90";
              } else {
                buttonClass = "border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-600 opacity-40";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={isAnswered}
                className={`p-5 text-left rounded-2xl border-2 transition-all font-medium flex items-center gap-4 ${buttonClass} ${
                  isSelected && !isAnswered ? "ring-2 ring-blue-300 dark:ring-blue-800" : ""
                }`}
              >
                <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs transition-colors ${
                  isAnswered && isCorrect ? "bg-green-500 border-green-500 text-white" : "bg-transparent border-current opacity-60"
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </button>
            );
          })}
        </div>

        {/* Phần Giải thích */}
        {isAnswered && (
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💡</span>
              <p className="text-sm font-black text-blue-800 dark:text-blue-300 uppercase tracking-wider">Giải thích chi tiết:</p>
            </div>
            <p className="text-sm text-blue-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {currentQuestion.explanation}
            </p>
            <Button 
              onClick={handleNext} 
              className="w-full mt-6 py-6 text-lg font-bold bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all"
            >
              {currentIdx === questions.length - 1 ? "Xem kết quả cuối cùng 🏁" : "Tiếp tục thử thách →"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}