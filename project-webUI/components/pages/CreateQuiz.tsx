'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

// 1. Định nghĩa Interface cho Props để khớp với page.tsx
interface CreateQuizProps {
  onGenerateQuiz: (subject: string, difficulty: string, count: number) => void;
  isLoading: boolean;
}

export function CreateQuiz({ onGenerateQuiz, isLoading }: CreateQuizProps) {
  const [formData, setFormData] = useState({
    subject: 'math',
    difficulty: 'medium',
    questions: 10,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'questions' ? parseInt(value) : value,
    }));
  };

  // 2. Hàm xử lý gửi yêu cầu tạo Quiz thật
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    // Gọi hàm từ Props truyền xuống
    onGenerateQuiz(formData.subject, formData.difficulty, formData.questions);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Custom Quiz</h1>
        <p className="text-gray-600">Generate a personalized practice quiz with AI</p>
      </div>

      <Card className="p-8 bg-white border border-gray-200 shadow-sm">
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Subject
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['math', 'reading', 'writing'].map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, subject }))
                  }
                  className={`p-4 rounded-lg font-medium capitalize transition-colors border-2 ${
                    formData.subject === subject
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['easy', 'medium', 'hard'].map((difficulty) => (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, difficulty }))
                  }
                  className={`p-4 rounded-lg font-medium capitalize transition-colors border-2 ${
                    formData.difficulty === difficulty
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Questions */}
          <div>
            <label htmlFor="questions" className="block text-sm font-semibold text-gray-900 mb-3">
              Number of Questions
            </label>
            <div className="flex items-center gap-4">
              <Input
                id="questions"
                type="number"
                name="questions"
                min="1"
                max="20" // Giới hạn 20 để tránh AI bị overload hoặc quá lâu
                value={formData.questions}
                onChange={handleInputChange}
                className="w-20 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="range"
                name="questions"
                min="1"
                max="20"
                value={formData.questions}
                onChange={handleInputChange}
                className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-sm text-gray-600 font-medium w-12 text-right">
                {formData.questions}
              </span>
            </div>
          </div>

          {/* Summary */}
          <Card className="p-4 bg-blue-50 border-0">
            <p className="text-sm text-gray-700">
              AI sẽ soạn một bài thi <span className="font-semibold">{formData.difficulty}</span> thuộc phần {formData.subject} gồm{' '}
              <span className="font-semibold">{formData.questions} câu hỏi</span> cho bạn.
            </p>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-6 rounded-lg text-lg transition-all active:scale-95"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                AI đang soạn câu hỏi...
              </span>
            ) : (
              'Generate with AI'
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}