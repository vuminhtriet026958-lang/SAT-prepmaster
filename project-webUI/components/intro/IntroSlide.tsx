"use client";
import { useState } from 'react'; // Thêm dòng này vào đầu file
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface IntroSlideProps {
  onStart: () => void;
}
// Hiệu ứng cho từng chữ cái xuất hiện
const sentence = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.5,
      staggerChildren: 0.08, // Tốc độ xuất hiện từng chữ
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
 const slides = [
    { title: "PREPMASTER", subtitle: "Shaping the Future", image: "logo-small.png", description: "How Artificial Intelligence help you learn SAT" },
    { title: "PRACTICE", subtitle: "Adaptive Learning", image: "/logo-small.png", description: "Thousands of SAT questions updated daily" },
    { title: "FOUNDERS", subtitle: "Meet the Team", image: "/team-photo.png", description: "Dedicated to your academic success" },
  ];
const totalSteps = slides.length;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Nếu đã ở slide cuối cùng (Founders) thì gọi hàm onStart để vào Dashboard
      onStart();
    }
  };
  return (
    <div className="relative w-full h-screen bg-[#f8f9fa] overflow-hidden flex items-center px-10 md:px-20">
      {/* Header Bar */}
      <div className="absolute top-0 left-0 w-full h-16 bg-[#1a1a1a] flex items-center px-6 justify-between text-white z-10">
        <div className="flex items-center gap-2">
          <img src="/logo-small.png" alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-sm tracking-widest">SAT-PREPMASTER</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 w-full items-center gap-10">
        
        {/* Cột Trái: Logo & Text */}
        <div className="flex flex-col space-y-4">
          {/* Logo SAT Ngọn lửa với hiệu ứng nhịp thở (Pulse) và trôi nổi (Float) */}
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

          {/* Chữ PREPMASTER xuất hiện từng ký tự */}
          <motion.h1 
  key={`title-${currentStep}`} // Thêm dòng này để chạy lại hiệu ứng khi đổi slide
  className="text-6xl md:text-8xl font-black text-black tracking-tighter uppercase"
  variants={sentence}
  initial="hidden"
  animate="visible"
>
  {/* Thay "PREPMASTER" bằng biến slides[currentStep - 1].title */}
  {slides[currentStep - 1].title.split("").map((char, index) => (
    <motion.span key={index} variants={letter}>
      {char}
    </motion.span>
  ))}
</motion.h1>

          <motion.p 
  key={`desc-${currentStep}`} // Thêm key để hiệu ứng opacity chạy lại khi đổi slide
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5 }} // Giảm delay một chút để hiện ra cùng lúc với chữ tiêu đề
  className="text-2xl text-gray-400 font-medium"
>
  {/* Lấy nội dung từ cột 'content' trong mảng slides của bạn */}
  {slides[currentStep - 1].description} 
</motion.p>
        </div>

        {/* Cột Phải: Ảnh Robot với khung bo góc đặc biệt */}
        <div className="relative flex justify-center">
          <motion.div 
            className="relative w-[350px] h-[450px] md:w-[450px] md:h-[550px] bg-slate-900 overflow-hidden"
            style={{ borderRadius: "100px 30px 150px 30px" }} // Tạo hình dáng khung giống ảnh của bạn
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <motion.img
              src="/robot-bg.png" // Thay bằng link ảnh robot của bạn
              alt="Robot AI"
              className="w-full h-full object-cover opacity-80"
              animate={{ scale: [1, 1.05, 1] }} // Hiệu ứng zoom nhẹ lặp lại
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>
      </div>

      {/* Nút điều hướng Slide (Bottom Right) */}
      <motion.button
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  onClick={handleNext} // Thêm sự kiện onClick ở đây
  className="absolute bottom-10 right-10 w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors z-50"
>
  <ArrowRight className="text-black w-8 h-8" />
</motion.button>

      {/* Text phụ ở dưới cùng */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 text-gray-500 text-sm italic">
        <div className="w-[2px] h-10 bg-gray-300"></div>
        <p>How Artificial Intelligence<br/>help you learn SAT</p>
      </div>
    </div>
  );
}