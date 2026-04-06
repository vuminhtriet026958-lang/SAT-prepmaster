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
  
  {/* --- BẮT ĐẦU ĐOẠN THÊM MỚI --- */}
  {currentQuestion.passage && currentQuestion.passage !== "null" && (
    <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 border-l-4 border-blue-500 rounded-r-2xl shadow-inner animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">
          Reading Passage
        </span>
      </div>
      <div className="text-gray-700 dark:text-slate-300 leading-relaxed text-base italic prose dark:prose-invert max-w-none">
        <p className="whitespace-pre-line">
          {currentQuestion.passage}
        </p>
      </div>
    </div>
  )}
  {/* --- KẾT THÚC ĐOẠN THÊM MỚI --- */}

  {/* Nội dung câu hỏi (Dòng cũ của bạn) */}
  <div className="flex items-start gap-3">
     <span className="text-2xl mt-1">❓</span>
     <h3 className="text-xl font-bold text-gray-800 dark:text-white leading-relaxed">
       {currentQuestion.text}
     </h3>
  </div>

  {/* ... các phần options bên dưới giữ nguyên ... */}

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