'use client';
import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/components/pages/Dashboard';
import { Practice } from '@/components/pages/Practice';
import { AITutor } from '@/components/pages/AITutor';
import { CreateQuiz } from '@/components/pages/CreateQuiz';
import { Entertainment } from '@/components/pages/Entertainment';
import { Profile } from '@/components/pages/Profile';
import { QuizPlayer } from '@/components/pages/QuizPlayer'; // Đảm bảo bạn đã tạo file này
import { Button } from '@/components/ui/button';

type Page = 'dashboard' | 'practice' | 'ai-tutor' | 'create-quiz' | 'entertainment' | 'profile';

type UserData = {
  name: string;
  level: number;
  exp: number;
  maxExp: number;
  streak: number;
  accuracy: number;
  quizzesCompleted: number;
  wrongAnswers: number;
  entertainmentMinutes: number;
};

type QuizStatus = 'idle' | 'playing' | 'finished';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [userData, setUserData] = useState<UserData>({
    name: 'Student',
    level: 5,
    exp: 340,
    maxExp: 500,
    streak: 7,
    accuracy: 82,
    quizzesCompleted: 12,
    wrongAnswers: 0,
    entertainmentMinutes: 0,
  });

  // --- STATE CHO AI QUIZ ---
  const [generatedQuiz, setGeneratedQuiz] = useState<any[]>([]);
  const [isQuizGenerating, setIsQuizGenerating] = useState(false);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('idle');
  const [lastQuizScore, setLastQuizScore] = useState(0);

  const [satQuestion, setSatQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- LOGIC ĐẾM NGƯỢC THỜI GIAN GIẢI TRÍ ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (currentPage === 'entertainment' && userData.entertainmentMinutes > 0) {
      timer = setInterval(() => {
        // CÁCH SỬA: Dùng hàm cập nhật (prev) để lấy giá trị mới nhất 
        // mà KHÔNG cần bỏ entertainmentMinutes vào mảng phụ thuộc bên dưới.
        setUserData((prev) => ({
          ...prev,
          entertainmentMinutes: Math.max(0, prev.entertainmentMinutes - 1),
        }));
      }, 60000); // 1 phút chạy 1 lần
    }

    return () => clearInterval(timer);
    
    // Mảng phụ thuộc CHỈ CẦN currentPage. 
    // Khi bạn chuyển sang trang khác hoặc quay lại trang giải trí, nó sẽ tính toán lại.
  }, [currentPage]);

  // --- HÀM TẠO QUIZ TỪ AI ---
  const handleGenerateQuiz = async (subject: string, difficulty: string, count: number) => {
    setIsQuizGenerating(true);
    setQuizStatus('idle');
    try {
      const response = await fetch("http://localhost:3010/api/generate-quiz", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, difficulty, count }),
      });

      const data = await response.json();
      if (data && data.questions) {
        setGeneratedQuiz(data.questions);
        setQuizStatus('playing');
      } else {
        throw new Error("Dữ liệu không hợp lệ");
      }
    } catch (error) {
      console.error("Lỗi tạo quiz:", error);
      alert("Không thể kết nối với server AI!");
    } finally {
      setIsQuizGenerating(false);
    }
  };

  // --- HÀM KHI HOÀN THÀNH QUIZ ---
  const handleFinishQuiz = (score: number) => {
    setLastQuizScore(score);
    setQuizStatus('finished');
    
    // Thưởng cho người học
    setUserData(prev => ({
      ...prev,
      exp: Math.min(prev.maxExp, prev.exp + (score * 15)),
      entertainmentMinutes: prev.entertainmentMinutes + (score * 2), // 1 câu đúng = 2 phút chơi
      quizzesCompleted: prev.quizzesCompleted + 1
    }));
  };

  const fetchAIQuestion = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3010/api/sat-question");
      const data = await response.json();
      setSatQuestion(data);
    } catch (error) {
      alert("Lỗi kết nối Server!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCorrectAnswer = () => {
    setUserData((prev) => ({
      ...prev,
      entertainmentMinutes: prev.entertainmentMinutes + 5,
      exp: Math.min(prev.maxExp, prev.exp + 20),
    }));
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onPageChange={setCurrentPage} userData={userData} onStartPractice={() => setCurrentPage('practice')} isLoading={isLoading} />;
      
      case 'practice':
        return <Practice onWrongAnswer={(c) => setUserData(p => ({...p, wrongAnswers: c}))} onCorrect={handleCorrectAnswer} />;
      case 'ai-tutor':
      return <AITutor />;
      case 'create-quiz':
        if (quizStatus === 'playing') {
          return <QuizPlayer questions={generatedQuiz} onFinish={handleFinishQuiz} />;
        }
        if (quizStatus === 'finished') {
          return (
            <div className="flex flex-col items-center justify-center p-12 space-y-6 text-center animate-in zoom-in-95 duration-300">
              <div className="text-7xl">🏆</div>
              <h2 className="text-3xl font-bold">Quiz Completed!</h2>
              <p className="text-xl text-gray-600">Bạn đã trả lời đúng <b>{lastQuizScore}/{generatedQuiz.length}</b> câu hỏi.</p>
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-medium">
                +{(lastQuizScore * 2)} phút chơi game đã được thêm!
              </div>
              <Button onClick={() => setQuizStatus('idle')} className="bg-blue-600 px-10">Tạo Quiz mới</Button>
            </div>
          );
        }
        return <CreateQuiz onGenerateQuiz={handleGenerateQuiz} isLoading={isQuizGenerating} />;

      case 'entertainment':
        return <Entertainment userData={userData} onStartPractice={fetchAIQuestion} satQuestion={satQuestion} isLoading={isLoading} setSatQuestion={setSatQuestion} />;
      
      case 'profile':
        return <Profile userData={userData} />;
      
      default:
        return null;
    }
  };

  return (
    <MainLayout
      currentPage={currentPage}
      onPageChange={(page: any) => {
        setCurrentPage(page);
        if (page !== 'create-quiz') setQuizStatus('idle'); // Reset trạng thái quiz khi chuyển trang
      }}
      userData={{
        name: userData.name,
        level: userData.level,
        exp: userData.exp,
        maxExp: userData.maxExp,
        streak: userData.streak,
      }}
    >
      <div className="container mx-auto py-6">
        {renderPage()}
      </div>
    </MainLayout>
  );
}