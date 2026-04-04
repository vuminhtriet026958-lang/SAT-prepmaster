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
  isQuiz?: boolean;
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

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
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
        id: 'err-' + Date.now(),
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
            <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <span>📝</span> Practice Question:
            </p>
            {quiz.passage && (
              <p className="italic bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border-l-4 border-blue-400 text-sm text-gray-700 dark:text-slate-300">
                {quiz.passage}
              </p>
            )}
            <p className="font-bold text-gray-900 dark:text-white leading-relaxed">{quiz.question}</p>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {quiz.choices && Object.entries(quiz.choices).map(([key, val]) => (
                <button
                  key={key}
                  className="text-left p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500 transition-all text-sm block w-full text-gray-700 dark:text-slate-300 group"
                  onClick={() => setInput(`Đáp án của mình là ${key}. Giải thích cho mình tại sao đúng/sai?`)}
                >
                  <span className="font-bold mr-2 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform inline-block">{key}.</span> {val as string}
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
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-4 space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Tutor Chat</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Hỏi bất cứ điều gì về SAT Math, Reading hoặc Writing</p>
      </div>

      {/* Chat Box */}
      <Card className="flex-1 overflow-hidden flex flex-col shadow-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 dark:bg-slate-950/50 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm transition-all ${
                msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none shadow-blue-500/20' 
                : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-bl-none shadow-black/5'
              }`}>
                <div className="text-[15px] leading-relaxed">
                  {renderMessageContent(msg)}
                </div>
                <span className={`text-[10px] block mt-2 opacity-50 font-medium ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-duration:0.8s]"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex gap-3 items-center">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về công thức Math, ngữ pháp..."
              className="w-full bg-gray-50 dark:bg-slate-800 border-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-white py-6 rounded-xl transition-all"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-6 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
          >
            {isLoading ? '...' : 'Gửi'}
          </Button>
        </form>
      </Card>
    </div>
  );
}