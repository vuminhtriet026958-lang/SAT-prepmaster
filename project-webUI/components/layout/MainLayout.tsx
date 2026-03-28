'use client';

import { useState } from 'react'; // Import useState để quản lý đóng/mở
import { Sidebar } from './Sidebar';

type MainLayoutProps = {
  currentPage: string;
  onPageChange: (page: string) => void;
  userData: {
    name: string;
    level: number;
    exp: number;
    maxExp: number;
    streak: number;
  };
  children: React.ReactNode;
};

export function MainLayout({
  currentPage,
  onPageChange,
  userData,
  children,
}: MainLayoutProps) {
  // 1. Khai báo state thu gọn
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 2. Sidebar: Truyền thêm isCollapsed và hàm setIsCollapsed */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={onPageChange}
        userData={userData}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* 3. Main Content: 
          - Bỏ ml-64 cố định. 
          - Dùng transition-all để co giãn mượt mà theo Sidebar.
      */}
      <main className="flex-1 overflow-auto transition-all duration-300">
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}