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
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
          Welcome Back!
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400">
          Keep practicing to improve your SAT score.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Level Card */}
        <Card className="p-6 bg-blue-50 border-0 shadow-sm !dark:bg-slate-900 dark:border dark:border-slate-800 transition-all">
          <div className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-2">Level</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{userData.level}</div>
        </Card>

        {/* Accuracy Card */}
        <Card className="p-6 bg-green-50 border-0 shadow-sm !dark:bg-slate-900 dark:border dark:border-slate-800 transition-all">
          <div className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-2">Accuracy</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{userData.accuracy}%</div>
        </Card>

        {/* Streak Card */}
        <Card className="p-6 bg-orange-50 border-0 shadow-sm !dark:bg-slate-900 dark:border dark:border-slate-800 transition-all">
          <div className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-2">Streak</div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{userData.streak}</div>
        </Card>

        {/* Quizzes Card */}
        <Card className="p-6 bg-purple-50 border-0 shadow-sm !dark:bg-slate-900 dark:border dark:border-slate-800 transition-all">
          <div className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-2">Quizzes</div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{userData.quizzesCompleted}</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={onStartPractice}
            disabled={isLoading}
            className="h-24 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-lg font-semibold rounded-xl transition-all"
          >
            {isLoading ? "AI đang soạn đề..." : "Start Practice"}
          </Button>
          
          <Button 
            onClick={() => onPageChange('ai-tutor')} 
            variant="outline" 
            className="h-24 text-lg font-semibold rounded-xl dark:bg-slate-900 dark:text-white dark:border-slate-800 dark:hover:bg-slate-800"
          >
            Ask AI Tutor
          </Button>

          <Button 
            onClick={() => onPageChange('entertainment')} 
            variant="outline" 
            className="h-24 text-lg font-semibold rounded-xl border-amber-200 hover:bg-amber-50 dark:border-amber-900/30 dark:bg-slate-900 dark:text-amber-400 dark:hover:bg-amber-900/20"
          >
            Entertainment 🎮
          </Button>
        </div>
      </div>
    </div>
  );
}