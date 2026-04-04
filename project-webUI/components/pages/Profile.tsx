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

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        setLoading(true);
        const q = query(
          collection(db, "history"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(50)
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

  const filteredData = history.filter(item => 
    activeTab === 'quizzes' ? item.type === 'quiz' : item.type === 'question'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Profile */}
      <Card className="p-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-blue-500/10">
            {userData.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{userData.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">
                Level {userData.level}
              </span>
              <p className="text-gray-500 dark:text-slate-400 text-sm">SAT Scholar</p>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100/50 dark:border-blue-800/30 transition-colors">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{userData.level}</p>
            <p className="text-xs text-gray-600 dark:text-slate-500 mt-1 uppercase font-medium">Level</p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100/50 dark:border-green-800/30 transition-colors">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{userData.accuracy}%</p>
            <p className="text-xs text-gray-600 dark:text-slate-500 mt-1 uppercase font-medium">Accuracy</p>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100/50 dark:border-orange-800/30 transition-colors">
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{userData.streak || 0}</p>
            <p className="text-xs text-gray-600 dark:text-slate-500 mt-1 uppercase font-medium">Streak</p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100/50 dark:border-purple-800/30 transition-colors">
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{userData.quizzesCompleted || 0}</p>
            <p className="text-xs text-gray-600 dark:text-slate-500 mt-1 uppercase font-medium">Quizzes</p>
          </div>
        </div>
      </Card>

      {/* History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">Learning History</h3>
          <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border dark:border-slate-700">
            <button 
              onClick={() => setActiveTab('quizzes')}
              className={`px-6 py-2 rounded-lg text-sm transition-all ${
                activeTab === 'quizzes' 
                ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-white font-bold' 
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
              }`}
            >
              Quizzes
            </button>
            <button 
              onClick={() => setActiveTab('questions')}
              className={`px-6 py-2 rounded-lg text-sm transition-all ${
                activeTab === 'questions' 
                ? 'bg-white dark:bg-slate-700 shadow-md text-red-600 dark:text-white font-bold' 
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
              }`}
            >
              Mistakes
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-gray-500 dark:text-slate-400 animate-pulse">Analyzing your progress...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <Card className="p-16 text-center bg-transparent border-2 border-dashed border-gray-200 dark:border-slate-800">
            <p className="text-gray-400 dark:text-slate-600 font-medium">No records found in this category yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredData.map((item) => (
              <Card key={item.id} className="p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:shadow-lg dark:hover:border-slate-700 transition-all group">
                {activeTab === 'quizzes' ? (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                         🏆
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">SAT Practice Quiz</p>
                        <p className="text-xs text-gray-500 dark:text-slate-500 font-medium">{item.timestamp?.toDate().toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{item.score}<span className="text-sm text-gray-400 dark:text-slate-600 font-normal">/{item.total}</span></p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-bold">Accuracy: {Math.round((item.score/item.total)*100)}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full uppercase font-black tracking-tighter">Mistake Detected</span>
                       <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">{item.timestamp?.toDate().toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-slate-200 font-semibold leading-relaxed">
                      <span className="text-blue-500 mr-2">Q:</span>{item.content?.question || "Question content missing"}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">
                        <span className="block font-black uppercase text-[9px] mb-1 opacity-60 italic">Your Answer</span>
                        <p className="font-bold text-sm">{item.userAnswer}</p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-100 dark:border-green-900/30">
                        <span className="block font-black uppercase text-[9px] mb-1 opacity-60 italic">Correct Answer</span>
                        <p className="font-bold text-sm">{item.correctAnswer}</p>
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