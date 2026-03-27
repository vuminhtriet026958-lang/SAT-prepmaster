'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';

interface PracticeProps {
  onWrongAnswer: (count: number) => void;
  onCorrect: () => void; 
  satQuestion: any;      
  onFetchQuestion: (category: string) => void; 
  isLoading: boolean;    
}

type Tab = 'math' | 'reading' | 'writing';

export function Practice({ 
  onWrongAnswer, 
  onCorrect, 
  satQuestion, 
  onFetchQuestion, 
  isLoading 
}: PracticeProps) {
  const [currentTab, setCurrentTab] = useState<Tab>('math');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });

  // Tự động tải câu hỏi khi đổi môn
  useEffect(() => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    onFetchQuestion(currentTab); 
  }, [currentTab]);

  const handleAnswerSelect = (index: number) => {
    if (showFeedback || !satQuestion) return;
    
    setSelectedAnswer(index);
    setShowFeedback(true);

    const labels = ['A', 'B', 'C', 'D'];
    const selectedLabel = labels[index];
    
    // So khớp với trường 'answer' từ Backend (ví dụ: "A")
    const isCorrect = selectedLabel === satQuestion.answer?.toUpperCase();

    if (!isCorrect) {
      const newWrongCount = stats.wrong + 1;
      setStats((prev) => ({ ...prev, wrong: newWrongCount }));
      onWrongAnswer(newWrongCount);
    } else {
      setStats((prev) => ({ ...prev, correct: prev.correct + 1 }));
      onCorrect(); 
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    onFetchQuestion(currentTab); 
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['math', 'reading', 'writing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`px-6 py-3 font-medium capitalize border-b-2 transition-colors ${
              currentTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-green-50 text-center border-0 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Correct</p>
        </Card>
        <Card className="p-4 bg-red-50 text-center border-0 shadow-sm">
          <div className="text-2xl font-bold text-red-600">{stats.wrong}</div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Wrong</p>
        </Card>
        <Card className="p-4 bg-blue-50 text-center border-0 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">
            {stats.correct + stats.wrong > 0 ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100) : 0}%
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Accuracy</p>
        </Card>
      </div>

      {/* Main Question Area */}
      <Card className="p-8 bg-white border border-gray-200 shadow-sm min-h-[450px] relative">
        {isLoading || !satQuestion ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400">AI is generating your {currentTab} challenge...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* 1. HIỂN THỊ ĐOẠN VĂN (Cho Reading/Writing) */}
            {satQuestion.passage && satQuestion.passage !== "null" && (
              <div className="mb-6 p-5 bg-slate-50 border-l-4 border-blue-500 rounded-r-xl shadow-sm">
                <p className="text-gray-700 leading-relaxed italic text-sm md:text-base">
                  {satQuestion.passage}
                </p>
              </div>
            )}

            {/* 2. CÂU HỎI */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 leading-tight whitespace-pre-line">
  {satQuestion.question}
</h2>
            </div>

            {/* 3. CÁC LỰA CHỌN ĐÁP ÁN */}
            <div className="grid gap-3 mb-8">
              {satQuestion.options?.map((option: string, index: number) => {
                const labels = ['A', 'B', 'C', 'D'];
                const isCorrect = labels[index] === satQuestion.answer;
                const isSelected = selectedAnswer === index;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showFeedback}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center ${
                      showFeedback 
                        ? isCorrect 
                          ? 'border-green-500 bg-green-50 text-green-700' 
                          : isSelected 
                            ? 'border-red-500 bg-red-50 text-red-700' 
                            : 'border-gray-100 text-gray-400 opacity-50'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full mr-4 border font-bold ${
                      showFeedback && isCorrect ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-500 border-gray-300'
                    }`}>
                      {labels[index]}
                    </span>
                    <span className="font-medium">{option.replace(/^[A-D]\)\s*/, '')}</span>
                  </button>
                );
              })}
            </div>

            {/* 4. GIẢI THÍCH (Bằng Tiếng Việt theo Prompt) */}
            {showFeedback && (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                <div className={`p-6 rounded-xl mb-6 border-0 ${
                  selectedAnswer !== null && ['A','B','C','D'][selectedAnswer] === satQuestion.answer 
                    ? 'bg-green-100/50 text-green-900' 
                    : 'bg-red-100/50 text-red-900'
                }`}>
                  <h4 className="font-bold text-lg mb-2">
                    {selectedAnswer !== null && ['A','B','C','D'][selectedAnswer] === satQuestion.answer ? '✨ Tuyệt vời!' : '📚 Cần xem lại'}
                  </h4>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {satQuestion.step_by_step_explanation || satQuestion.explanation}
                  </p>
                </div>
                <Button onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold rounded-xl shadow-lg transition-transform active:scale-95">
                  Next Question →
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}