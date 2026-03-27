'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';

// 1. Cập nhật Props để nhận được hàm onCorrect từ page.tsx
interface PracticeProps {
  onWrongAnswer: (count: number) => void;
  onCorrect: () => void; 
}

type Tab = 'math' | 'reading' | 'writing';

// Câu hỏi dự phòng khi Server AI tắt
const FALLBACK_QUESTION = {
  text: '[Dự phòng do Server AI đang tắt] What is the area of a circle with radius 5?',
  options: ['A) 25π', 'B) 50π', 'C) 10π', 'D) 15π'],
  correct: 0,
  explanation: 'Area = πr² = π(5)² = 25π',
};

export function Practice({ onWrongAnswer, onCorrect }: PracticeProps) {
  const [currentTab, setCurrentTab] = useState<Tab>('math');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, skipped: 0 });

  // 2. Hàm gọi AI tạo câu hỏi
  const fetchQuestionFromAI = async () => {
    setIsLoading(true);
    setSelectedAnswer(null);
    setShowFeedback(false);
    
    try {
      // Gọi đến Server Node.js của bạn
      const response = await fetch(`http://localhost:3010/api/sat-question?category=${currentTab}`);
      const data = await response.json();
      
      // Giả sử API của bạn trả về { text, options, correct, explanation }
      if (data && data.options) {
        setCurrentQuestion(data);
      } else {
        throw new Error("Dữ liệu AI trả về không đúng định dạng");
      }
    } catch (error) {
      console.error("Lỗi khi gọi AI:", error);
      // Nếu lỗi (chưa bật server), dùng câu hỏi dự phòng để không bị kẹt UI
      setCurrentQuestion(FALLBACK_QUESTION); 
    } finally {
      setIsLoading(false);
    }
  };

  // Tự động gọi AI khi mới vào trang hoặc đổi Tab
  useEffect(() => {
    fetchQuestionFromAI();
  }, [currentTab]);

  // Nếu chưa có câu hỏi hoặc đang tải, hiển thị màn hình chờ
  if (!currentQuestion || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-gray-600">AI đang suy nghĩ và soạn câu hỏi cho bạn...</p>
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentQuestion.correct;

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
    setShowFeedback(true);

    if (index !== currentQuestion.correct) {
      setStats((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
      if ((stats.wrong + 1) % 2 === 0) {
        onWrongAnswer(stats.wrong + 1);
      }
    } else {
      setStats((prev) => ({ ...prev, correct: prev.correct + 1 }));
      // 3. GỌI HÀM ONCORRECT ĐỂ MỞ KHÓA GAME
      onCorrect(); 
    }
  };

  const handleNext = () => {
    fetchQuestionFromAI(); // Gọi AI tạo câu hỏi mới
  };

  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
    setStats({ correct: 0, wrong: 0, skipped: 0 });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Practice Zone</h1>
        <p className="text-gray-600">Trả lời câu hỏi AI tạo ra để tích lũy thời gian chơi game</p>
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
        <Card className="p-4 bg-green-50 border-0 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
          <p className="text-sm text-gray-600">Correct</p>
        </Card>
        <Card className="p-4 bg-red-50 border-0 shadow-sm">
          <div className="text-2xl font-bold text-red-600">{stats.wrong}</div>
          <p className="text-sm text-gray-600">Wrong</p>
        </Card>
        <Card className="p-4 bg-blue-50 border-0 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">
            {stats.correct + stats.wrong > 0 
              ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100) 
              : 0}%
          </div>
          <p className="text-sm text-gray-600">Accuracy</p>
        </Card>
      </div>

      {/* Question Card */}
      <Card className="p-8 bg-white border border-gray-200 shadow-sm">
        <div className="mb-6">
          <p className="text-lg font-semibold text-gray-900">{currentQuestion.text}</p>
        </div>

        {/* Answer Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={showFeedback}
              className={`w-full p-4 text-left font-medium rounded-lg border-2 transition-all ${
                selectedAnswer === index
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 bg-white text-gray-900 hover:border-blue-300'
              } ${showFeedback && !isCorrect && index === currentQuestion.correct ? 'border-green-500 bg-green-50 text-green-700' : ''}`}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className="mb-6">
            <Card className={`p-4 border-0 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="font-semibold mb-2">{isCorrect ? 'Correct! +5 phút chơi game' : 'Incorrect'}</p>
              <p className="text-sm">{currentQuestion.explanation}</p>
            </Card>
          </div>
        )}

        {/* Next Button */}
        {showFeedback && (
          <Button onClick={handleNext} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg">
            Tạo câu hỏi tiếp theo
          </Button>
        )}
      </Card>
    </div>
  );
}