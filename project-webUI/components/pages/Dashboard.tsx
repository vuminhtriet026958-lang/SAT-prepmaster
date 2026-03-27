'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function Dashboard({
  onPageChange,
  userData,
  onStartPractice, 
  isLoading
}: any) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
        <p className="text-lg text-gray-600">Keep practicing to improve your SAT score.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-blue-50 border-0 shadow-sm">
          <div className="text-sm text-gray-600 font-medium mb-2">Level</div>
          <div className="text-3xl font-bold text-blue-600">{userData.level}</div>
        </Card>
        <Card className="p-6 bg-green-50 border-0 shadow-sm">
          <div className="text-sm text-gray-600 font-medium mb-2">Accuracy</div>
          <div className="text-3xl font-bold text-green-600">{userData.accuracy}%</div>
        </Card>
        <Card className="p-6 bg-orange-50 border-0 shadow-sm">
          <div className="text-sm text-gray-600 font-medium mb-2">Streak</div>
          <div className="text-3xl font-bold text-orange-600">{userData.streak}</div>
        </Card>
        <Card className="p-6 bg-purple-50 border-0 shadow-sm">
          <div className="text-sm text-gray-600 font-medium mb-2">Quizzes</div>
          <div className="text-3xl font-bold text-purple-600">{userData.quizzesCompleted}</div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={onStartPractice}
            disabled={isLoading}
            className="h-24 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl"
          >
            {isLoading ? "AI đang soạn đề..." : "Start Practice"}
          </Button>
          <Button onClick={() => onPageChange('ai-tutor')} variant="outline" className="h-24 text-lg font-semibold rounded-xl">
            Ask AI Tutor
          </Button>
          <Button onClick={() => onPageChange('entertainment')} variant="outline" className="h-24 text-lg font-semibold rounded-xl border-amber-200 hover:bg-amber-50">
             Entertainment 🎮
          </Button>
        </div>
      </div>
    </div>
  );
}