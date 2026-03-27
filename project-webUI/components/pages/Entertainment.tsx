'use client';

import { Card } from '@/components/ui/card';

// 1. Định nghĩa interface để TypeScript không báo lỗi "userData"
interface UserData {
  name: string;
  level: number;
  exp: number;
  maxExp: number;
  streak: number;
  accuracy: number;
  quizzesCompleted: number;
  wrongAnswers: number;
  entertainmentMinutes: number;
}

interface EntertainmentProps {
  userData: UserData;
  onStartPractice: () => void;
  satQuestion: any;
  isLoading: boolean;
  setSatQuestion: (data: any) => void;
}

export function Entertainment({ 
  userData, 
  onStartPractice, 
  satQuestion, 
  isLoading, 
  setSatQuestion 
}: EntertainmentProps) { 
  
  // Lấy số phút trực tiếp từ userData đã được cộng ở page.tsx
  const playTime = userData.entertainmentMinutes;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Entertainment Zone</h2>
          <p className="text-gray-500">Học tập chăm chỉ, vui chơi hết mình!</p>
        </div>
        {/* Hiển thị số phút còn lại */}
        <div className="bg-purple-100 text-purple-700 px-6 py-3 rounded-full font-bold shadow-sm border border-purple-200">
          🎮 Thời gian chơi: {playTime} phút
        </div>
      </div>

      <Card className="p-4 bg-white shadow-xl border-2 border-purple-100 min-h-[600px] flex items-center justify-center relative overflow-hidden">
        {/* Logic mở khóa: Nếu có phút (> 0) thì hiện Game, nếu không thì hiện Khóa */}
        {playTime > 0 ? (
          <div className="w-full">
             <div className="mb-2 text-sm text-purple-600 animate-pulse font-medium">
                ⚡ Hệ thống đang trừ 1 phút sau mỗi 60 giây bạn ở đây...
             </div>
             <iframe 
               src="/index.html" 
               className="w-full h-[700px] border-0 rounded-lg shadow-inner"
               title="Sudoku Game"
             />
          </div>
        ) : (
          <div className="text-center space-y-6 p-10">
            <div className="relative inline-block">
                <span className="text-8xl">🔒</span>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">Locked</span>
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-800">Bạn chưa có thời gian chơi!</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Mỗi câu trả lời đúng ở phần <b>Practice</b> sẽ đổi được <b>5 phút</b> giải trí. 
                  Hiện tại bạn đang có 0 phút.
                </p>
            </div>
            <button 
              onClick={() => window.location.reload()} // Hoặc điều hướng sang tab Practice
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg active:scale-95"
            >
              Quay lại học ngay!
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}