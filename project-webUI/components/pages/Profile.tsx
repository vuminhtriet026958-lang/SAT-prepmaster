'use client';

import { Card } from '@/components/ui/card';

type ProfileProps = {
  userData: {
    name: string;
    level: number;
    exp: number;
    maxExp: number;
    streak: number;
    accuracy: number;
    quizzesCompleted: number;
  };
};

const ACHIEVEMENTS = [
  { id: 1, name: 'First Steps', description: 'Complete your first quiz', unlocked: true },
  { id: 2, name: 'On Fire', description: '7-day streak', unlocked: true },
  { id: 3, name: 'Accuracy Master', description: '95%+ accuracy', unlocked: false },
  { id: 4, name: 'Math Wizard', description: 'Complete 10 math quizzes', unlocked: true },
  { id: 5, name: 'Reading Pro', description: 'Complete 10 reading quizzes', unlocked: false },
  { id: 6, name: 'Writing Expert', description: 'Complete 10 writing quizzes', unlocked: false },
];

export function Profile({ userData }: ProfileProps) {
  const unlockedAchievements = ACHIEVEMENTS.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
        <p className="text-gray-600">Track your SAT prep journey</p>
      </div>

      {/* User Header */}
      <Card className="p-8 bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
            {userData.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{userData.name}</h2>
            <p className="text-gray-600">Level {userData.level}</p>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{userData.level}</p>
            <p className="text-sm text-gray-600 mt-1">Current Level</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{userData.accuracy}%</p>
            <p className="text-sm text-gray-600 mt-1">Accuracy</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-3xl font-bold text-orange-600">{userData.streak}</p>
            <p className="text-sm text-gray-600 mt-1">Day Streak</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">
              {userData.quizzesCompleted}
            </p>
            <p className="text-sm text-gray-600 mt-1">Quizzes Done</p>
          </div>
        </div>
      </Card>

      {/* Experience Details */}
      <Card className="p-6 bg-white border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-lg text-gray-900 mb-4">Experience Progress</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Total XP</span>
            <span className="font-bold text-gray-900">{userData.exp}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all"
              style={{
                width: `${Math.min(
                  (userData.exp / userData.maxExp) * 100,
                  100
                )}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{userData.exp}/{userData.maxExp} XP to next level</span>
            <span>
              {Math.round((userData.exp / userData.maxExp) * 100)}%
            </span>
          </div>
        </div>
      </Card>

      {/* Achievements */}
      <div>
        <h3 className="font-semibold text-lg text-gray-900 mb-4">
          Achievements ({unlockedAchievements}/{ACHIEVEMENTS.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((achievement) => (
            <Card
              key={achievement.id}
              className={`p-4 border-0 shadow-sm ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-yellow-50 to-amber-50'
                  : 'bg-gray-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">
                  {achievement.unlocked ? '🏆' : '🔒'}
                </span>
                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      achievement.unlocked
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {achievement.name}
                  </p>
                  <p
                    className={`text-sm ${
                      achievement.unlocked
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {achievement.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Study Stats */}
      <Card className="p-6 bg-white border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-lg text-gray-900 mb-4">Study Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Questions</p>
            <p className="text-2xl font-bold text-gray-900">342</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Questions Correct</p>
            <p className="text-2xl font-bold text-green-600">289</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Study Hours</p>
            <p className="text-2xl font-bold text-blue-600">24.5</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Best Subject</p>
            <p className="text-2xl font-bold text-purple-600">Reading</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
