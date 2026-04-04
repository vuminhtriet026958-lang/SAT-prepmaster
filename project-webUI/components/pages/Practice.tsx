'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";

const saveResult = async (score: number, totalQuestions: number, wrongAnswers: any[]) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    // 1. Lưu lịch sử lượt làm bài này
    await addDoc(collection(db, "quiz_history"), {
      userId: user.uid,
      score: score,
      total: totalQuestions,
      timestamp: serverTimestamp(),
    });

    // 2. Lưu danh sách câu sai để ôn tập (Mistake Bank)
    for (const item of wrongAnswers) {
      await addDoc(collection(db, "wrong_questions"), {
        userId: user.uid,
        question: item.question,
        yourAnswer: item.userAnswer,
        correctAnswer: item.correctAnswer,
        timestamp: serverTimestamp(),
      });
    }

    // 3. Cộng EXP cho User (Ví dụ mỗi câu đúng được 10 EXP)
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      totalExp: increment(score * 10),
      quizzesDone: increment(1)
    });

  } catch (error) {
    console.error("Lỗi lưu dữ liệu:", error);
  }
};
interface PracticeProps {
  onWrongAnswer: (data: { question: string; userAnswer: string; correctAnswer: string }) => void;
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

  const handleAnswerSelect = async (index: number) => {
  if (showFeedback || !satQuestion || isLoading) return;

  setSelectedAnswer(index);
  setShowFeedback(true);

  const labels = ['A', 'B', 'C', 'D'];
  const selectedLabel = labels[index];
  
  // Lấy đáp án đúng (ví dụ: "A")
  const correctLetter = satQuestion.answer?.trim().charAt(0).toUpperCase();
  const isCorrect = selectedLabel === correctLetter;

  if (!isCorrect) {
    setStats((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
    
    // TRUYỀN THÊM DỮ LIỆU: Để lưu vào mục Mistakes ở Profile
    onWrongAnswer({
      question: satQuestion.question,
      userAnswer: selectedLabel,
      correctAnswer: correctLetter
    });
  } else {
    setStats((prev) => ({ ...prev, correct: prev.correct + 1 }));
    // Gọi hàm cộng XP
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
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-800">
        {(['math', 'reading', 'writing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`px-6 py-3 font-medium capitalize border-b-2 transition-colors ${
              currentTab === tab 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 text-center border-0 shadow-sm transition-colors">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.correct}</div>
          <p className="text-xs text-gray-500 dark:text-slate-500 uppercase tracking-wider">Correct</p>
        </Card>
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 text-center border-0 shadow-sm transition-colors">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.wrong}</div>
          <p className="text-xs text-gray-500 dark:text-slate-500 uppercase tracking-wider">Wrong</p>
        </Card>
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 text-center border-0 shadow-sm transition-colors">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.correct + stats.wrong > 0 ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100) : 0}%
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-500 uppercase tracking-wider">Accuracy</p>
        </Card>
      </div>

      {/* Main Question Area */}
      <Card className="p-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm min-h-[450px] relative transition-colors">
        {isLoading || !satQuestion ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 dark:text-slate-500">AI is generating your {currentTab} challenge...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* 1. HIỂN THỊ ĐOẠN VĂN */}
            {satQuestion.passage && satQuestion.passage !== "null" && (
              <div className="mb-6 p-5 bg-slate-50 dark:bg-slate-800/50 border-l-4 border-blue-500 rounded-r-xl shadow-sm">
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed italic text-sm md:text-base">
                  {satQuestion.passage}
                </p>
              </div>
            )}

            {/* 2. CÂU HỎI */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white leading-snug"> 
                {satQuestion.question.replace(/\\\(|\\\)/g, '')} 
              </h2>
            </div>

            {/* 3. CÁC LỰA CHỌN ĐÁP ÁN */}
            <div className="grid gap-3 mb-8">
              {satQuestion.options?.map((option: string, index: number) => {
                const labels = ['A', 'B', 'C', 'D'];
                const correctLetter = satQuestion.answer?.trim().charAt(0).toUpperCase();
                const isCorrect = labels[index] === correctLetter;
                const isSelected = selectedAnswer === index;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showFeedback}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center ${
                      showFeedback 
                        ? isCorrect 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                          : isSelected 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                            : 'border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-600 opacity-50'
                        : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                  >
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full mr-4 border font-bold transition-colors ${
                      showFeedback && isCorrect 
                        ? 'bg-green-500 text-white border-green-500' 
                        : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-300 dark:border-slate-600'
                    }`}>
                      {labels[index]}
                    </span>
                    <span className="font-medium">{option.replace(/^[A-D]\)\s*/, '')}</span>
                  </button>
                );
              })}
            </div>

            {/* 4. GIẢI THÍCH */}
            {showFeedback && (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                <div className={`p-6 rounded-xl mb-6 border-0 ${
                  selectedAnswer !== null && ['A','B','C','D'][selectedAnswer] === satQuestion.answer 
                    ? 'bg-green-100/50 dark:bg-green-900/40 text-green-900 dark:text-green-100' 
                    : 'bg-red-100/50 dark:bg-red-900/40 text-red-900 dark:text-red-100'
                }`}>
                  <h4 className="font-bold text-lg mb-2">
                    {selectedAnswer !== null && ['A','B','C','D'][selectedAnswer] === satQuestion.answer ? '✨ Tuyệt vời!' : '📚 Cần xem lại'}
                  </h4>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {satQuestion.step_by_step_explanation || satQuestion.explanation}
                  </p>
                </div>
                <Button 
                  onClick={handleNext} 
                  disabled={isLoading}
                  className="w-full py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl shadow-lg transition-all"
                >
                  {isLoading ? 'AI đang soạn đề...' : 'Next Question →'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
);
}