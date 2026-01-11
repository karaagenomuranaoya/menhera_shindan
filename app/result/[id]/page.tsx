import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Skull, Flame, Quote, Trophy, FileText } from 'lucide-react';
import { getDailyRanking } from '../../lib/ranking';
import RankingList from '../../components/RankingList';

type Props = {
  params: Promise<{ id: string }>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DEFAULT_ID = 'b3dfe464-a323-47f6-a4b7-ccadbb176a58';

async function getDiagnosisData(id: string) {
  let { data } = await supabase.from('diagnoses').select('*').eq('id', id).single();
  
  if (!data) {
    const fallback = await supabase.from('diagnoses').select('*').eq('id', DEFAULT_ID).single();
    data = fallback.data;
  }
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getDiagnosisData(id);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yamikoi-shindan.vercel.app';

  if (!data) return { title: 'AI狂愛コロシアム' };

  const ogUrl = new URL('/api/og', baseUrl);
  ogUrl.searchParams.set('id', data.id);

  const pageTitle = `称号: ${data.title || data.rank_name} (Score: ${data.score.toLocaleString()}) - AI狂愛コロシアム`;

  return {
    title: pageTitle,
    description: data.comment,
    openGraph: {
      title: pageTitle,
      description: data.comment,
      images: [ogUrl.toString()],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: data.comment,
      images: [ogUrl.toString()],
    },
  };
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;
  const result = await getDiagnosisData(id);

  // ランキングデータを取得
  const rankings = await getDailyRanking();

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-red-600">
        <p className="font-bold mb-4 tracking-widest">DATA LOST IN VOID.</p>
        <Link href="/" className="text-red-500 underline decoration-red-900">RETURN</Link>
      </div>
    );
  }

  const title = result.title || result.rank_name;
  const pickUpPhrase = result.pick_up_phrase || result.answer;

  return (
    <main className="min-h-screen bg-black text-red-600 flex flex-col items-center justify-center p-4 font-sans relative">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20 bg-[url('/noise.png')] mix-blend-overlay"></div>

      <div className="w-full max-w-md bg-black/90 p-6 rounded-sm border border-red-900/50 shadow-[0_0_50px_rgba(139,0,0,0.3)] backdrop-blur-md space-y-8 text-center relative overflow-hidden z-10">
        
        <div className="absolute top-0 right-0 bg-red-900 text-black text-[10px] font-bold px-3 py-1 z-10 tracking-widest">
          PUBLIC RECORD
        </div>

        <h1 className="text-xl font-black tracking-[0.3em] text-red-700 mt-4 border-b border-red-900 pb-2 inline-block">
          JUDGMENT
        </h1>

        {/* ランクと画像 - 元の配置に戻し */}
        <div className="space-y-4">
          <div className="text-[clamp(3rem,12vw,4.5rem)] font-black text-red-600 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] italic whitespace-nowrap leading-none">
            {result.grade}
          </div>
          
          <div className="relative w-64 h-64 mx-auto group">
            <div className="absolute inset-0 bg-red-900 blur-2xl opacity-30 animate-pulse"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={result.image_url} 
              alt={result.grade}
              className="relative w-full h-full object-cover border-2 border-red-900 grayscale contrast-125"
            />
          </div>

          <div className="mt-4">
            <span className="text-[10px] text-red-500 block mb-1">TITLE</span>
            <div className="text-2xl font-black text-white tracking-wider leading-tight text-shadow-blood">
              {title}
            </div>
          </div>
        </div>

        {/* 詳細データ */}
        <div className="space-y-6 text-left px-2 border-t border-red-900/30 pt-6">
          <div className="text-center mb-6">
            <div className="text-xs text-red-900 font-mono tracking-widest mb-1 flex items-center justify-center gap-1">
              <Trophy size={12} /> TOTAL SCORE
            </div>
            <div className="text-[3rem] font-black text-red-500 italic font-mono leading-none tracking-tighter">
              {result.score.toLocaleString()}
            </div>
          </div>

          {/* キラーフレーズ */}
          <div className="bg-red-950/10 p-6 border border-red-900/30 relative overflow-hidden text-center">
            <Quote size={20} className="absolute top-2 left-2 text-red-900/30 rotate-180" />
            <div className="absolute top-0 right-0 bg-red-900 text-black text-[9px] font-black px-2 py-1 tracking-tighter">PICK UP</div>
            <p className="text-lg text-red-100 font-black leading-snug font-serif italic opacity-90">
              {pickUpPhrase}
            </p>
            <Quote size={20} className="absolute bottom-2 right-2 text-red-900/30" />
          </div>

          {/* 全文表示 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-black text-red-800 uppercase tracking-widest">
              <FileText size={10} /> Your LOVE
            </div>
            <div className="bg-black/50 p-4 border border-red-900/30 text-xs text-red-300/60 font-mono leading-relaxed break-words whitespace-pre-wrap shadow-inner">
              {result.answer}
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block">Review</span>
            <p className="text-sm text-red-200/80 font-medium leading-relaxed font-serif">
              {result.comment}
            </p>
          </div>
        </div>

        

        {/* アクション */}
        <div className="pt-4 space-y-3">
          <p className="text-xs text-center text-red-800 font-bold tracking-widest">
            あなたもどう？
          </p>
          <Link href="/" className="group block w-full py-4 bg-red-950 text-red-500 border border-red-800 rounded-sm font-black hover:bg-red-900 hover:text-black hover:border-red-500 transition-all text-center uppercase tracking-widest flex items-center justify-center gap-2">
            <Skull size={18} className="group-hover:animate-bounce" />
            CHALLENGE NOW
            <Skull size={18} className="group-hover:animate-bounce" />
          </Link>
        </div>
      </div>
      <div className="w-full max-w-md relative z-10 space-y-6 pb-20">
        <div className="flex items-center justify-between border-b border-red-900/50 pb-2">
          <h2 className="text-sm font-black text-red-500 tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-red-600 animate-pulse"></span>
            DAILY TOP 5
          </h2>
          <Link href="/ranking" className="text-[10px] text-red-800 hover:text-red-500 underline decoration-dotted">
            すべて見る
          </Link>
        </div>
        
        {/* 上位5件だけ表示 */}
        <RankingList rankings={rankings} limit={5} />
      </div>
    </main>
  );
}