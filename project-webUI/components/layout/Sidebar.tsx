'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const handleLogout = async () => {
  await signOut(auth);
  localStorage.removeItem("localUserData");
  window.location.reload(); 
};
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
  // THÊM 2 DÒNG NÀY ĐỂ HẾT LỖI Ở MAINLAYOUT
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
  const pages = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'practice', label: 'Practice', icon: '✏️' },
    { id: 'ai-tutor', label: 'AI Tutor', icon: '🤖' },
    { id: 'create-quiz', label: 'Create Quiz', icon: '📝' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎮' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'founders', label: 'Founders', icon: '🤝' }, // Thêm mục Nhà sáng lập ở đây
  ];

  const xpPercentage = (userData.exp / userData.maxExp) * 100;

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 shadow-sm flex flex-col transition-all duration-300 z-50 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Nút Thu Gọn (Toggle) */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-white border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:bg-gray-50 z-50"
      >
        {isCollapsed ? '→' : '←'}
      </button>

      {/* Header: Thông tin User */}
      <div className={`p-4 border-b border-gray-200 ${isCollapsed ? 'items-center' : ''}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="min-w-[48px] w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {userData.name.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <p className="font-semibold text-gray-900 truncate">{userData.name}</p>
              <p className="text-sm text-gray-500">Level {userData.level}</p>
            </div>
          )}
        </div>

        {/* XP Progress: Ẩn khi thu gọn */}
        {!isCollapsed && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-600">Experience</span>
              <span className="text-xs text-gray-500">
                {userData.exp}/{userData.maxExp}
              </span>
            </div>
            <Progress value={xpPercentage} className="h-2" />
          </div>
        )}

        {/* Streak */}
        <div className={`flex items-center gap-2 text-sm ${isCollapsed ? 'justify-center' : ''}`}>
          <span className="text-xl">🔥</span>
          {!isCollapsed && (
            <span className="text-gray-700 font-medium">
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
            title={isCollapsed ? page.label : ''}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              currentPage === page.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
          >
            <span className="text-xl shrink-0">{page.icon}</span>
            {!isCollapsed && <span className="truncate">{page.label}</span>}
          </button>
        ))}
      </nav>

      {/* Settings & Logout */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {/* Nút Đổi Màu (Dark Mode) */}
        <Button
          variant="ghost"
          className={`w-full text-gray-600 hover:bg-gray-100 flex items-center gap-3 ${
            isCollapsed ? 'justify-center px-0' : 'justify-start'
          }`}
          onClick={() => {
            // Tạm thời log ra để Triet thấy nút đã hoạt động
            console.log("Đang chuyển chế độ màu...");
            alert("Tính năng Dark Mode sẽ sớm ra mắt ở bản v1.1!");
          }}
        >
          <span className="text-xl">🌙</span>
          {!isCollapsed && <span>Dark Mode</span>}
        </Button>

        {/* Nút Logout Thật */}
        <Button
          variant="outline"
          className={`w-full text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 ${
            isCollapsed ? 'justify-center px-0' : 'justify-start'
          }`}
          onClick={handleLogout} // Đã gắn hàm handleLogout ở đầu file của bạn
        >
          <span className="text-xl">🚪</span>
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}