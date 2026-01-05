import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

type Props = {
  params: Promise<{ id: string }>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 動的にメタデータを生成（OGP設定）
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase.from('diagnoses').select('*').eq('id', id).single();

  if (!data) return { title: '診断結果が見つかりません' };

  const ogUrl = new URL('/api/og', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  ogUrl.searchParams.set('id', id);

  return {
    title: `AIメンヘラ診断結果 - ${data.rank_name}`,
    description: data.comment,
    openGraph: {
      title: 'AIメンヘラ診断',
      description: data.comment,
      images: [ogUrl.toString()],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AIメンヘラ診断',
      description: data.comment,
      images: [ogUrl.toString()],
    },
  };
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;

  // DBから結果を取得
  const { data: result, error } = await supabase
    .from('diagnoses')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f8f5ff]">
        <p className="text-purple-400 font-bold mb-4">結果が見つかりませんでした。</p>
        <Link href="/" className="text-purple-500 underline">トップへ戻る</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f5ff] text-purple-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white/70 p-6 rounded-[2.5rem] border border-purple-100 shadow-2xl shadow-purple-200/50 backdrop-blur-xl space-y-8 text-center">
        
        <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-purple-500 to-pink-400">
          AIメンヘラ診断結果
        </h1>

        <div className="space-y-4">
          <div className="text-[clamp(2rem,12vw,3.75rem)] font-black text-pink-400 drop-shadow-[0_4px_10px_rgba(244,114,182,0.3)] italic whitespace-nowrap leading-none">
            Rank : {result.grade}
          </div>
          
          <div className="relative w-64 h-64 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-300 to-purple-300 rounded-[2.5rem] blur-3xl opacity-40"></div>
            <img 
              src={result.image_url} 
              alt={result.grade}
              className="relative w-full h-full object-cover rounded-[2rem] border-4 border-white shadow-xl"
            />
          </div>

          <div className="text-xl font-black text-purple-800 pt-4">
            {result.rank_name}
          </div>
          
          {result.warning && (
            <div className="inline-block bg-pink-50 text-pink-400 px-5 py-1.5 rounded-full border border-pink-100 text-xs font-bold">
              {result.warning}
            </div>
          )}
        </div>

        <div className="space-y-6 text-left px-2 border-t border-purple-100 pt-6">
          <div className="text-center mb-4">
            <div className="text-[clamp(1.8rem,10vw,3.75rem)] font-black text-pink-400 italic leading-none">
              Score : {result.score}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Question</span>
            <p className="text-xs text-purple-800 font-medium leading-relaxed">{result.question}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-pink-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-pink-100 text-pink-500 text-[9px] font-black px-3 py-1 rounded-bl-xl tracking-tighter">USER ANSWER</div>
            <p className="text-base text-purple-900 font-bold leading-relaxed pt-2">
              {result.answer}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black text-pink-300 uppercase tracking-widest">Review</span>
            <p className="text-sm text-purple-800/80 font-medium leading-relaxed">
              {result.comment}
            </p>
          </div>
        </div>

        <Link href="/" className="block w-full py-4 bg-gradient-to-r from-purple-400 to-pink-300 text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg text-center">
          自分も診断してみる
        </Link>
      </div>
    </main>
  );
}