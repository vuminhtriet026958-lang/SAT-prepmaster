'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type SidebarProps = {
  currentPage: string;
  onPageChange: (page: string) => void;
  userData: {
    name: string;
    level: number;
    exp: number;
    maxExp: number;
    streak: number;
  };
};

export function Sidebar({
  currentPage,
  onPageChange,
  userData,
}: SidebarProps) {
  const pages = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'practice', label: 'Practice' },
    { id: 'ai-tutor', label: 'AI Tutor' },
    { id: 'create-quiz', label: 'Create Quiz' },
    { id: 'entertainment', label: 'Entertainment' },
    { id: 'profile', label: 'Profile' },
  ];

  const xpPercentage = (userData.exp / userData.maxExp) * 100;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
            {userData.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{userData.name}</p>
            <p className="text-sm text-gray-500">Level {userData.level}</p>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-600">Experience</span>
            <span className="text-xs text-gray-500">
              {userData.exp}/{userData.maxExp}
            </span>
          </div>
          <Progress value={xpPercentage} className="h-2" />
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xl">🔥</span>
          <span className="text-gray-700 font-medium">
            {userData.streak} day streak
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => onPageChange(page.id)}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
              currentPage === page.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {page.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="outline"
          className="w-full text-gray-700 border-gray-300 hover:bg-gray-50"
          onClick={() => {}}
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}
