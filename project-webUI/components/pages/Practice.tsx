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

  // 1. Tự động gọi AI khi đổi Tab
  useEffect(() => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    onFetchQuestion(currentTab); 
  }, [currentTab]);

  // 2. Logic kiểm tra đáp án
  const handleAnswerSelect = (index: number) => {
    if (showFeedback || !satQuestion) return;
    
    setSelectedAnswer(index);
    setShowFeedback(true);

    const labels = ['A', 'B', 'C', 'D'];
    const selectedLabel = labels[index];
    
    // So khớp đáp án (AI trả về 'A', 'B', 'C', hoặc 'D')
    const isCorrect = selectedLabel === satQuestion.answer;

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

  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
    // Reset stats khi đổi môn học nếu muốn, hoặc giữ nguyên tùy bạn
    setStats({ correct: 0, wrong: 0 });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Practice Zone</h1>
        <p className="text-gray-600">Trả lời câu hỏi AI để tích lũy kinh nghiệm và thời gian chơi game</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['math', 'reading', 'writing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-6 py-3 font-medium capitalize border-b-2 transition-colors ${
              currentTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-green-50 border-0 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
          <p className="text-sm text-gray-600">Đúng</p>
        </Card>
        <Card className="p-4 bg-red-50 border-0 shadow-sm text-center">
          <div className="text-2xl font-bold text-red-600">{stats.wrong}</div>
          <p className="text-sm text-gray-600">Sai</p>
        </Card>
        <Card className="p-4 bg-blue-50 border-0 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.correct + stats.wrong > 0 
              ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100) 
              : 0}%
          </div>
          <p className="text-sm text-gray-600">Tỷ lệ đúng</p>
        </Card>
      </div>

      {/* Question Card */}
      <Card className="p-8 bg-white border border-gray-200 shadow-sm min-h-[400px] flex flex-col justify-center">
        {isLoading || !satQuestion ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 animate-pulse">AI đang soạn câu hỏi {currentTab}...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* PHẦN QUAN TRỌNG: Hiển thị Passage cho Reading/Writing */}
            {satQuestion.passage && (
              <div className="mb-6 p-4 bg-slate-50 border-l-4 border-blue-400 rounded-r-lg">
                <p className="text-sm leading-relaxed text-gray-700 italic">{satQuestion.passage}</p>
              </div>
            )}

            <div className="mb-6">
              <p className="text-lg font-semibold text-gray-900 leading-snug">
                {satQuestion.question}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-6">
              {satQuestion.options && satQuestion.options.map((option: string, index: number) => {
                const labels = ['A', 'B', 'C', 'D'];
                const isAnswerCorrect = labels[index] === satQuestion.answer;
                const isUserSelected = selectedAnswer === index;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showFeedback}
                    className={`w-full p-4 text-left font-medium rounded-xl border-2 transition-all duration-200 ${
                      showFeedback 
                        ? isAnswerCorrect 
                          ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' 
                          : isUserSelected 
                            ? 'border-red-500 bg-red-50 text-red-700' 
                            : 'border-gray-100 text-gray-400 opacity-60'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
                    }`}
                  >
                    <span className="inline-block w-8 h-8 rounded-full bg-white border border-inherit text-center leading-7 mr-3 shadow-sm">
                      {labels[index]}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            {showFeedback && (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                <Card className={`p-5 border-0 mb-6 shadow-inner ${
                  selectedAnswer !== null && ['A','B','C','D'][selectedAnswer] === satQuestion.answer 
                    ? 'bg-green-100/50 text-green-900' 
                    : 'bg-red-100/50 text-red-900'
                }`}>
                  <p className="font-bold mb-2 flex items-center gap-2">
                    {selectedAnswer !== null && ['A','B','C','D'][selectedAnswer] === satQuestion.answer ? '✅ Chính xác!' : '❌ Chưa đúng rồi!'}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {satQuestion.step_by_step_explanation || satQuestion.explanation}
                  </p>
                </Card>
                <Button onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold rounded-xl shadow-lg transition-transform active:scale-95">
                  Câu hỏi tiếp theo →
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}