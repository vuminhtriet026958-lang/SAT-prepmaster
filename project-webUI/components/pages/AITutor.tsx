'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState, useRef, useEffect } from 'react';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isQuiz?: boolean; // Đánh dấu nếu tin nhắn chứa câu hỏi trắc nghiệm
};

export function AITutor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Mình là AI SAT Tutor. Bạn cần mình giải thích kiến thức hay muốn luyện tập thử một câu hỏi nào không?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      // Dùng timeout nhỏ để đảm bảo DOM đã render xong trước khi cuộn
      setTimeout(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }, 100);
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userContent = input;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userContent,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // --- SỬA LỖI URL TẠI ĐÂY ---
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://sat-prepmaster.onrender.com";
      
      const res = await fetch(`${API_BASE_URL}/api/ai-tutor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userContent }),
      });

      if (!res.ok) throw new Error("Mạng lỗi");

      const data = await res.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        sender: 'ai',
        timestamp: new Date(),
        isQuiz: data.isQuiz || false 
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: 'err-' + Date.now(), // Đảm bảo ID luôn unique
        text: "Hệ thống đang bận hoặc server chưa khởi động xong, bạn thử lại sau giây lát nhé!",
        sender: 'ai',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (msg: Message) => {
    if (msg.isQuiz) {
      try {
        const quiz = JSON.parse(msg.text);
        return (
          <div className="space-y-3">
            <p className="font-medium text-blue-700">📝 Practice Question:</p>
            {quiz.passage && (
              <p className="italic bg-gray-50 p-2 rounded border-l-4 border-blue-400 text-sm">
                {quiz.passage}
              </p>
            )}
            <p className="font-bold">{quiz.question}</p>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {quiz.choices && Object.entries(quiz.choices).map(([key, val]) => (
                <button
                  key={key}
                  className="text-left p-2 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all text-sm block w-full"
                  onClick={() => setInput(`Đáp án của mình là ${key}. Giải thích cho mình tại sao đúng/sai?`)}
                >
                  <span className="font-bold mr-2">{key}.</span> {val as string}
                </button>
              ))}
            </div>
          </div>
        );
      } catch {
        return <p className="whitespace-pre-wrap">{msg.text}</p>;
      }
    }
    return <p className="whitespace-pre-wrap">{msg.text}</p>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto w-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">AI Tutor Chat</h1>
        <p className="text-sm text-gray-500">Hỏi bất cứ điều gì về SAT Math, Reading hoặc Writing</p>
      </div>

      {/* Chat Box */}
      <Card className="flex-1 overflow-hidden flex flex-col shadow-lg border-gray-200">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}>
                {renderMessageContent(msg)}
                <span className={`text-[10px] block mt-2 opacity-60 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-lg shadow-sm flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ví dụ: Giải thích cho mình về cách dùng dấu phẩy trong SAT Writing..."
            className="flex-1 bg-gray-50 border-none focus-visible:ring-blue-500"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-700">
            Gửi
          </Button>
        </form>
      </Card>
    </div>
  );
}