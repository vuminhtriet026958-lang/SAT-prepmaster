"use client";
import { useState } from 'react'; 
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

interface IntroSlideProps {
  onStart: () => void;
}

const sentence = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.5,
      staggerChildren: 0.08,
    },
  },
};

const letter = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export default function IntroFlow({ onStart }: IntroSlideProps) {
  const [currentStep, setCurrentStep] = useState(1); 

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Chào mừng:", result.user.displayName);
      onStart(); 
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
    }
  };

  const slides = [
    { 
      title: "PREPMASTER", 
      subtitle: "Shaping the Future", 
      image: "/picture/logo-small.png", 
      description: "Hành trình chinh phục SAT bắt đầu từ đây với AI" 
    },
    { 
      title: "PRACTICE", 
      subtitle: "Adaptive Learning", 
      image: "/picture/logo-small.png", 
      description: "Thousands of SAT questions updated daily" 
    }
  ];
  
  const totalSteps = slides.length;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#f8f9fa] overflow-hidden flex items-center px-10 md:px-20">
      {/* Header Bar */}
      <div className="absolute top-0 left-0 w-full h-16 bg-[#1a1a1a] flex items-center px-6 justify-between text-white z-10">
        <div className="flex items-center gap-2">
          <img src="/picture/logo-small.png" alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-sm tracking-widest">SAT-PREPMASTER</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 w-full items-center gap-10">
        {/* Cột Trái: Logo & Text */}
        <div className="flex flex-col space-y-4">
          <motion.img
            key={`logo-${currentStep}`}
            src={slides[currentStep - 1].image}
            alt="Intro Image"
            className="w-64 md:w-80 object-contain"
            animate={{ 
              y: [0, -15, 0],
              filter: ["drop-shadow(0 0 10px #00d2ff)", "drop-shadow(0 0 25px #00d2ff)", "drop-shadow(0 0 10px #00d2ff)"] 
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.h1 
            key={`title-${currentStep}`}
            className="text-6xl md:text-8xl font-black text-black tracking-tighter uppercase"
            variants={sentence}
            initial="hidden"
            animate="visible"
          >
            {slides[currentStep - 1].title.split("").map((char, index) => (
              <motion.span key={index} variants={letter}>
                {char}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p 
            key={`desc-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl text-gray-400 font-medium"
          >
            {slides[currentStep - 1].description} 
          </motion.p>
        </div>

        {/* Cột Phải: Ảnh Robot */}
        <div className="relative flex justify-center">
          <motion.div 
            className="relative w-[350px] h-[450px] md:w-[450px] md:h-[550px] bg-slate-900 overflow-hidden"
            style={{ borderRadius: "100px 30px 150px 30px" }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <motion.img
              src="/picture/ai-robot.png"
              alt="Robot AI Large"
              className="w-full h-full object-cover opacity-80"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>
      </div>

      {/* Nút điều hướng linh hoạt (Bottom Right) */}
      <div className="absolute bottom-10 right-10 z-50">
        {currentStep === totalSteps ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoogleLogin}
            className="px-8 py-4 bg-black text-white rounded-full font-bold shadow-2xl flex items-center gap-3 hover:bg-gray-800 transition-all border-2 border-white/20"
          >
            <div className="bg-white p-1 rounded-full">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            BẮT ĐẦU VỚI GOOGLE
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowRight className="text-black w-8 h-8" />
          </motion.button>
        )}
      </div>

      {/* Text phụ ở dưới cùng */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 text-gray-500 text-sm italic">
        <div className="w-[2px] h-10 bg-gray-300"></div>
        <p>How Artificial Intelligence<br/>help you learn SAT</p>
      </div>
    </div>
  );
}