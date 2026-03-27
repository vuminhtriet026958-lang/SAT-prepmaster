'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';

// --- 1. SỬA LỖI ĐỎ: Cập nhật Props để khớp với page.tsx ---
interface PracticeProps {
  onWrongAnswer: (count: number) => void;
  onCorrect: () => void; 
  satQuestion: any;      // Thêm dòng này để nhận dữ liệu từ page.tsx
  onFetchQuestion: (category: string) => void; // Thêm dòng này
  isLoading: boolean;    // Thêm dòng này
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

  // --- 2. TỰ ĐỘNG GỌI AI KHI ĐỔI TAB ---
  useEffect(() => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    onFetchQuestion(currentTab); // Gọi hàm từ page.tsx truyền xuống
  }, [currentTab]);

  // Màn hình Loading
  if (isLoading || !satQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-gray-600">AI đang soạn câu hỏi {currentTab} cho bạn...</p>
      </div>
    );
  }

  // --- 3. LOGIC KIỂM TRA ĐÁP ÁN ---
  // Lưu ý: AI trả về correct_answer là nhãn 'A', 'B', 'C', 'D'
  const handleAnswerSelect = (index: number) => {
    if (showFeedback) return;
    
    setSelectedAnswer(index);
    setShowFeedback(true);

    const labels = ['A', 'B', 'C', 'D'];
    const selectedLabel = labels[index];
    const isCorrect = selectedLabel === satQuestion.answer;

    if (!isCorrect) {
      setStats((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
      onWrongAnswer(stats.wrong + 1);
    } else {
      setStats((prev) => ({ ...prev, correct: prev.correct + 1 }));
      onCorrect(); 
    }
  };

  const handleNext = () => {
    onFetchQuestion(currentTab);
  };

  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
    setStats({ correct: 0, wrong: 0 });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Practice Zone</h1>
        <p className="text-gray-600">Trả lời câu hỏi AI để tích lũy kinh nghiệm và thời gian giải trí</p>
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
      <Card className="p-8 bg-white border border-gray-200 shadow-sm">
        <div className="mb-6">
          <p className="text-lg font-semibold text-gray-900">{satQuestion.question}</p>
        </div>

        <div className="space-y-3 mb-6">
          {satQuestion.options.map((option: string, index: number) => {
            const labels = ['A', 'B', 'C', 'D'];
            const isAnswerCorrect = labels[index] === satQuestion.answer;
            const isUserSelected = selectedAnswer === index;

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showFeedback}
                className={`w-full p-4 text-left font-medium rounded-lg border-2 transition-all ${
                  showFeedback 
                    ? isAnswerCorrect 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : isUserSelected 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-100 text-gray-400'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <Card className={`p-4 border-0 mb-6 ${selectedAnswer !== null && ['A','B','C','D'][selectedAnswer] === satQuestion.answer ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="font-bold mb-1">Giải thích:</p>
              <p className="text-sm leading-relaxed">{satQuestion.step_by_step_explanation}</p>
            </Card>
            <Button onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">
              Câu hỏi tiếp theo →
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}