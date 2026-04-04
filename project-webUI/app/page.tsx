'use client';
import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/components/pages/Dashboard';
import { Practice } from '@/components/pages/Practice';
import { AITutor } from '@/components/pages/AITutor';
import { CreateQuiz } from '@/components/pages/CreateQuiz';
import { Entertainment } from '@/components/pages/Entertainment';
import { Profile } from '@/components/pages/Profile';
import { QuizPlayer } from '@/components/pages/QuizPlayer';
import { Button } from '@/components/ui/button';
import { Founders } from '@/components/pages/Founders';
// Chèn phần import Intro và Animation
import  IntroFlow  from "@/components/intro/IntroSlide";
import { AnimatePresence, motion } from "framer-motion";

type Page = 'dashboard' | 'practice' | 'ai-tutor' | 'create-quiz' | 'entertainment' | 'profile' | 'founders';

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
  // --- PHẦN THÊM MỚI: State kiểm soát Intro ---
  const [showIntro, setShowIntro] = useState(true);

  // --- GIỮ NGUYÊN TOÀN BỘ LOGIC CŨ CỦA BẠN ---
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
const [isClient, setIsClient] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any[]>([]);
  const [isQuizGenerating, setIsQuizGenerating] = useState(false);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('idle');
  const [lastQuizScore, setLastQuizScore] = useState(0);

  const [satQuestion, setSatQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
  setIsClient(true);
  const hasSeen = localStorage.getItem("hasSeenIntro");
  if (!hasSeen) {
    setShowIntro(true);
  }
    let timer: NodeJS.Timeout;
    if (currentPage === 'entertainment' && userData.entertainmentMinutes > 0) {
      timer = setInterval(() => {
        setUserData((prev) => ({
          ...prev,
          entertainmentMinutes: Math.max(0, prev.entertainmentMinutes - 1),
        }));
      }, 60000);
    }
    return () => clearInterval(timer);
  }, [currentPage, userData.entertainmentMinutes]);

  const handleGenerateQuiz = async (subject: string, difficulty: string, count: number) => {
    setIsQuizGenerating(true);
    setQuizStatus('idle');
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://sat-prepmaster.onrender.com";
      const response = await fetch(`${API_BASE_URL}/api/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, difficulty, count }),
      });
      
      const data = await response.json();
      if (data && data.questions) {
        setGeneratedQuiz(data.questions);
        setQuizStatus('playing');
      } else {
        throw new Error("Dữ Error");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối server AI!");
    } finally {
      setIsQuizGenerating(false);
    }
  };

  const handleFinishQuiz = (score: number) => {
    setLastQuizScore(score);
    setQuizStatus('finished');
    setUserData(prev => ({
      ...prev,
      exp: Math.min(prev.maxExp, prev.exp + (score * 15)),
      entertainmentMinutes: prev.entertainmentMinutes + (score * 2),
      quizzesCompleted: prev.quizzesCompleted + 1
    }));
  };

  const fetchAIQuestion = async (category = 'math') => {
    if (isLoading) return; 
    setIsLoading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://sat-prepmaster.onrender.com";
      const response = await fetch(`${API_BASE_URL}/api/sat-question?category=${category}&t=${Date.now()}`);
      if (!response.ok) throw new Error("Server Error");
      const data = await response.json();
      if (data && data.question) {
        setSatQuestion(data);
      }
    } catch (error) {
      console.error("AI Fetch Error:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
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
        return (
          <Practice 
            onWrongAnswer={(c) => setUserData(p => ({...p, wrongAnswers: c}))} 
            onCorrect={handleCorrectAnswer}
            satQuestion={satQuestion} 
            onFetchQuestion={fetchAIQuestion}
            isLoading={isLoading}
          />
        );
      case 'ai-tutor':
        return <AITutor />;
      case 'create-quiz':
        if (quizStatus === 'playing') {
          return <QuizPlayer questions={generatedQuiz} onFinish={handleFinishQuiz} />;
        }
        if (quizStatus === 'finished') {
          return (
            <div className="flex flex-col items-center justify-center p-12 space-y-6 text-center">
              <div className="text-7xl">🏆</div>
              <h2 className="text-3xl font-bold">Quiz Completed!</h2>
              <p className="text-xl text-gray-600">Bạn đã trả lời đúng <b>{lastQuizScore}/{generatedQuiz.length}</b> câu hỏi.</p>
              <Button onClick={() => setQuizStatus('idle')} className="bg-blue-600 px-10">Tạo Quiz mới</Button>
            </div>
          );
        }
        return <CreateQuiz onGenerateQuiz={handleGenerateQuiz} isLoading={isQuizGenerating} />;
      case 'entertainment':
        return <Entertainment userData={userData} onStartPractice={fetchAIQuestion} satQuestion={satQuestion} isLoading={isLoading} setSatQuestion={setSatQuestion} />;
      case 'profile':
        return <Profile userData={userData} />;
      case 'founders':
        return <Founders />;
      default:
        return null;
    }
  };

  // --- PHẦN HIỂN THỊ CÓ CHÈN INTRO ---
  return (
    <AnimatePresence mode="wait">
      {showIntro ? (
        // Hiển thị IntroFlow trước
        <motion.div 
          key="intro" 
          initial={{ opacity: 1 }} 
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          {/* Giả định IntroFlow của bạn có nhận props onStart để tắt Intro */}
          <IntroFlow onStart={() => {
            localStorage.setItem("hasSeenIntro", "true");
            setShowIntro(false);}} />
        </motion.div>
      ) : (
        // Sau khi xong Intro mới hiện MainLayout và App chính
        
        <div className="min-h-screen bg-gray-50"> 
    <motion.div
      key="main-app"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      <MainLayout 
        currentPage={currentPage}
        userData={userData}
        onPageChange={(page: any) => {
          setCurrentPage(page);
          if (page !== 'create-quiz') setQuizStatus('idle');
        }}
      >
        {/* Nội dung Dashboard của bạn */}
        <div className="p-4">
           {/* Render các component dựa trên currentPage ở đây */}
        </div>
      </MainLayout>
    </motion.div>
  </div> /* ĐÓNG THẺ DIV MỚI THÊM */
)}
    </AnimatePresence>
  );
}