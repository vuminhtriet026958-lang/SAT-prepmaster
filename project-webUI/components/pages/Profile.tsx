'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

type ProfileProps = {
  userData: any;
};

export function Profile({ userData }: ProfileProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'questions'>('quizzes');
  const [loading, setLoading] = useState(true);

  // Hàm lấy dữ liệu từ Firestore
  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        setLoading(true);
        // Lấy dữ liệu từ collection "history" (Bạn nhớ đổi tên đúng với collection bạn tạo nhé)
        const q = query(
          collection(db, "history"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(50) // Giới hạn 50 mục để tránh overload
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHistory(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchHistory();
    });

    return () => unsubscribe();
  }, []);

  // Lọc dữ liệu hiển thị theo tab
  const filteredData = history.filter(item => 
    activeTab === 'quizzes' ? item.type === 'quiz' : item.type === 'question'
  );

  return (
    <div className="space-y-6">
      {/* Header Profile giữ nguyên ... */}
      <Card className="p-8 bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
            {userData.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{userData.name}</h2>
            <p className="text-gray-600">Level {userData.level}</p>
          </div>
        </div>
        
        {/* Stats Grid dùng userData thực từ Firebase */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{userData.level}</p>
            <p className="text-sm text-gray-600 mt-1">Current Level</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{userData.accuracy}%</p>
            <p className="text-sm text-gray-600 mt-1">Accuracy</p>
          </div>
          {/* ... các chỉ số khác */}
        </div>
      </Card>

      {/* --- MỤC QUAN TRỌNG: LỊCH SỬ VÀ CÂU SAI --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-gray-900">Learning History</h3>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('quizzes')}
              className={`px-4 py-1.5 rounded-md text-sm transition-all ${activeTab === 'quizzes' ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}
            >
              Quizzes
            </button>
            <button 
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-1.5 rounded-md text-sm transition-all ${activeTab === 'questions' ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}
            >
              Mistakes
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading your history...</p>
        ) : filteredData.length === 0 ? (
          <Card className="p-10 text-center text-gray-400 border-dashed">
            No data found for this category yet.
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredData.map((item) => (
              <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                {activeTab === 'quizzes' ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">SAT Practice Quiz</p>
                      <p className="text-xs text-gray-500">{item.timestamp?.toDate().toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{item.score}/{item.total}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Score</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                       <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase font-bold">Wrong Answer</span>
                       <span className="text-xs text-gray-400">{item.timestamp?.toDate().toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-800 font-medium">Q: {item.content?.question || "Question content missing"}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-red-50 text-red-700 rounded border border-red-100">
                        <span className="block font-bold opacity-50">Your Answer</span>
                        {item.userAnswer}
                      </div>
                      <div className="p-2 bg-green-50 text-green-700 rounded border border-green-100">
                        <span className="block font-bold opacity-50">Correct Answer</span>
                        {item.correctAnswer}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}