'use client';

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
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        onPageChange={onPageChange}
        userData={userData}
      />
      <main className="flex-1 ml-64 overflow-auto">
        <div className="p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
