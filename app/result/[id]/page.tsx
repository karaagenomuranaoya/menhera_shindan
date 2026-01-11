import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Skull, Flame } from 'lucide-react';

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

  return {
    title: `審判結果：${data.rank_name} - AI狂愛コロシアム`,
    description: data.comment,
    openGraph: {
      title: 'AI狂愛コロシアム',
      description: data.comment,
      images: [ogUrl.toString()],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AI狂愛コロシアム',
      description: data.comment,
      images: [ogUrl.toString()],
    },
  };
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;
  const result = await getDiagnosisData(id);

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-red-600">
        <p className="font-bold mb-4 tracking-widest">DATA LOST IN VOID.</p>
        <Link href="/" className="text-red-500 underline decoration-red-900">RETURN</Link>
      </div>
    );
  }

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

          <div className="text-lg font-bold text-red-500 pt-4 tracking-widest">
            {result.rank_name}
          </div>
          {result.warning && (
            <div className="inline-block bg-black text-red-400 px-4 py-1 border border-red-800 text-xs font-mono">
              ⚠ {result.warning}
            </div>
          )}
        </div>

        <div className="space-y-6 text-left px-2 border-t border-red-900/30 pt-6">
          <div className="text-center mb-4">
            <div className="text-sm text-red-900 font-mono tracking-widest mb-1">SCORE</div>
            <div className="text-4xl font-black text-red-500 italic font-mono">
              {result.score}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black text-red-800 uppercase tracking-widest block">Question</span>
            <p className="text-xs text-red-300 font-medium leading-relaxed border-l-2 border-red-900 pl-3">
              {result.question || "UNKNOWN"}
            </p>
          </div>

          <div className="bg-red-950/10 p-5 border border-red-900/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-red-900 text-black text-[9px] font-black px-2 py-1 tracking-tighter">ANSWER</div>
            <p className="text-base text-red-100 font-bold leading-relaxed pt-2 font-serif italic opacity-90">
              {result.answer}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block">Review</span>
            <p className="text-sm text-red-200/80 font-medium leading-relaxed font-serif">
              {result.comment}
            </p>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <p className="text-xs text-center text-red-800 font-bold tracking-widest">
            ARE YOU NEXT?
          </p>
          <Link href="/" className="group block w-full py-4 bg-red-950 text-red-500 border border-red-800 rounded-sm font-black hover:bg-red-900 hover:text-black hover:border-red-500 transition-all text-center uppercase tracking-widest flex items-center justify-center gap-2">
            <Skull size={18} className="group-hover:animate-bounce" />
            ENTER THE ARENA
            <Skull size={18} className="group-hover:animate-bounce" />
          </Link>
        </div>
      </div>
    </main>
  );
}