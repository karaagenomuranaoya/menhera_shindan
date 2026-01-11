// app/ranking/page.tsx
import Link from 'next/link';
import { getDailyRanking } from '../lib/ranking';
import RankingList from '../components/RankingList';
import { ChevronLeft, Flame } from 'lucide-react';

export const revalidate = 60; // ISR

export default async function RankingPage() {
  const rankings = await getDailyRanking();

  return (
    <main className="min-h-screen bg-black text-red-600 p-4 pb-20 font-sans relative">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20 bg-[url('/noise.png')] mix-blend-overlay"></div>
      
      <div className="max-w-md mx-auto relative z-10">
        <header className="flex items-center justify-between mb-8 pt-4">
          <Link href="/" className="text-red-800 hover:text-red-500 transition-colors">
            <ChevronLeft />
          </Link>
          <h1 className="text-xl font-black tracking-widest text-red-600 glitch-hover text-center">
            DAILY MADNESS
            <span className="block text-[10px] text-red-900 tracking-[0.5em] mt-1">本日の狂気ランキング</span>
          </h1>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <RankingList rankings={rankings} />

        <div className="mt-12 text-center space-y-4">
          <p className="text-xs text-red-800">
            ※ランキングは毎日0:00(UTC)にリセットされます。<br/>
            愛の重さを更新するのは、あなたです。
          </p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-950 text-red-500 border border-red-800 rounded-sm font-black hover:bg-red-900 hover:text-black hover:border-red-500 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(139,0,0,0.3)]"
          >
            <Flame size={18} />
            挑 戦 す る
            <Flame size={18} />
          </Link>
        </div>
      </div>
    </main>
  );
}