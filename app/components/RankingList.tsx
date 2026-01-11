// app/components/RankingList.tsx
import Link from 'next/link';
import { Crown, Trophy, Medal } from 'lucide-react';
import { RankingItem } from '../lib/ranking';

type Props = {
  rankings: RankingItem[];
  limit?: number; // 表示件数制限
};

export default function RankingList({ rankings, limit }: Props) {
  const displayRankings = limit ? rankings.slice(0, limit) : rankings;

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown size={24} className="text-yellow-400 fill-yellow-400 animate-pulse" />;
      case 1: return <Trophy size={20} className="text-gray-300" />;
      case 2: return <Medal size={20} className="text-amber-700" />;
      default: return <span className="font-mono text-red-900 font-bold">#{index + 1}</span>;
    }
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return "border-yellow-500/50 bg-yellow-950/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
    if (index === 1) return "border-gray-500/50 bg-gray-950/20";
    if (index === 2) return "border-amber-700/50 bg-orange-950/10";
    return "border-red-900/30 bg-black/40";
  };

  if (rankings.length === 0) {
    return (
      <div className="text-center p-8 text-red-900 text-sm font-mono border border-red-900/30 rounded-sm">
        NO RECORDS YET. <br/>
        BE THE FIRST LEGEND.
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full max-w-md mx-auto">
      {displayRankings.map((item, index) => (
        <Link 
          href={`/result/${item.id}`} 
          key={item.id}
          className={`block p-4 rounded-sm border transition-all hover:scale-[1.02] group relative overflow-hidden ${getRankStyle(index)}`}
        >
          {/* 背景エフェクト */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>

          <div className="flex items-start gap-3 relative z-10">
            {/* 順位 */}
            <div className="flex-shrink-0 w-8 flex justify-center pt-1">
              {getRankIcon(index)}
            </div>

            <div className="flex-grow min-w-0">
              {/* 称号とスコア */}
              <div className="flex justify-between items-baseline mb-1 flex-wrap">
                <span className="text-xs font-bold text-red-500 truncate mr-2 max-w-[60%]">
                  {item.title || "名もなき怪物"}
                </span>
                {/* ★ここを修正: Gradeを追加してScoreと並べる */}
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                    item.grade === 'GOD' 
                      ? 'text-yellow-500 bg-yellow-950/50 border-yellow-700 animate-pulse' 
                      : 'text-red-400 bg-red-950/50 border-red-900/50'
                  }`}>
                    {item.grade}
                  </span>
                  <span className="font-mono font-black text-red-600 text-sm">
                    {item.score.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* 回答（ここがコンテンツ！） */}
              <div className="text-[11px] text-red-200/80 line-clamp-2 font-serif italic border-l-2 border-red-900/50 pl-2">
                &ldquo;{item.answer}&rdquo;
              </div>

              {/* ランクバッジ */}
              <div className="absolute top-2 right-2 opacity-10 font-black text-4xl italic text-red-500 pointer-events-none">
                {item.grade}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}