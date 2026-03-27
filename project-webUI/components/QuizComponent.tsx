'use client';
import { useEffect, useState } from 'react';

type Question = {
  question: string;
  options: string[];
  answer: string;
};

export default function QuizComponent({
  onFinish,
}: {
  onFinish: (score: number) => void;
}) {
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/api/quiz")
      .then(res => res.json())
      .then(data => {
        setQuiz(data.questions);
        setLoading(false);
      });
  }, []);

  const handleSelect = (qIndex: number, option: string) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = option;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    let score = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.answer) score++;
    });

    onFinish(score);
  };

  if (loading) return <p>Loading quiz...</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">AI Quiz</h2>

      {quiz.map((q, i) => (
        <div key={i} className="mb-4">
          <p className="font-medium">{q.question}</p>
          {q.options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(i, opt)}
              className="block border p-2 mt-1 w-full text-left"
            >
              {opt}
            </button>
          ))}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Submit
      </button>
    </div>
  );
}