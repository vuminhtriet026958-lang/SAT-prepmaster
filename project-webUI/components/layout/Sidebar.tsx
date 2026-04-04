'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from 'next/navigation'

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
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
};

export function Sidebar({
  currentPage,
  onPageChange,
  userData,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  const pages = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'practice', label: 'Practice', icon: '✏️' },
    { id: 'ai-tutor', label: 'AI Tutor', icon: '🤖' },
    { id: 'create-quiz', label: 'Create Quiz', icon: '📝' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎮' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'founders', label: 'Founders', icon: '🤝' },
  ];

  const xpPercentage = (userData.exp / userData.maxExp) * 100;

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen flex flex-col transition-all duration-500 z-50 
        bg-white border-r border-gray-200 shadow-sm 
        dark:bg-[#0f172a] dark:border-slate-800 dark:shadow-none
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Nút Thu Gọn (Toggle) */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-white border border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 z-50"
      >
        {isCollapsed ? '→' : '←'}
      </button>

      {/* Header: Thông tin User */}
      <div className={`p-4 border-b border-gray-200 dark:border-slate-800 ${isCollapsed ? 'items-center' : ''}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="min-w-[48px] w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {userData.name.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <p className="font-semibold text-gray-900 dark:text-white truncate">{userData.name}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Level {userData.level}</p>
            </div>
          )}
        </div>

        {/* XP Progress */}
        {!isCollapsed && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Experience</span>
              <span className="text-xs text-gray-500 dark:text-slate-500">
                {userData.exp}/{userData.maxExp}
              </span>
            </div>
            {/* Thêm dark:bg-slate-800 để thanh progress nổi bật trên nền tối */}
            <Progress value={xpPercentage} className="h-2 dark:bg-slate-800" />
          </div>
        )}

        {/* Streak */}
        <div className={`flex items-center gap-2 text-sm ${isCollapsed ? 'justify-center' : ''}`}>
          <span className="text-xl">🔥</span>
          {!isCollapsed && (
            <span className="text-gray-700 dark:text-slate-300 font-medium">
              {userData.streak} day streak
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => onPageChange(page.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              currentPage === page.id
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400'
                : 'text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
          >
            <span className="text-xl shrink-0">{page.icon}</span>
            {!isCollapsed && <span className="truncate">{page.label}</span>}
          </button>
        ))}
      </nav>

      {/* Settings & Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-800 space-y-2">
        <Button
          variant="ghost"
          className={`w-full text-gray-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white flex items-center gap-3 ${
            isCollapsed ? 'justify-center px-0' : 'justify-start'
          }`}
          onClick={() => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
          }}
        >
          <span className="text-xl">🌙</span>
          {!isCollapsed && <span>Dark Mode</span>}
        </Button>

        <Button
          variant="outline"
          className={`w-full text-red-500 border-red-100 dark:border-red-900/30 dark:hover:bg-red-900/20 flex items-center gap-3 ${
            isCollapsed ? 'justify-center px-0' : 'justify-start'
          }`}
          onClick={handleLogout}
        >
          <span className="text-xl">🚪</span>
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}