import { Metadata } from 'next';
import DiagnosisClient from './DiagnosisClient';
import { createClient } from '@supabase/supabase-js';
import { getDailyRanking } from './lib/ranking'; // 追加

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DEFAULT_ID = 'b3dfe464-a323-47f6-a4b7-ccadbb176a58';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { id } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yamikoi-shindan.vercel.app';
  const targetId = (typeof id === 'string' ? id : DEFAULT_ID);
  
  // try-catch等でエラーハンドリングしても良いですが、ここではシンプルに
  const { data } = await supabase.from('diagnoses').select('*').eq('id', targetId).single();

  if (!data) {
    return {
      title: "AI 闇恋診断",
      description: "あなたの愛の重さを闇恋系のお友達AIが診断します。",
      openGraph: {
        title: "AI 闇恋診断",
        description: "あなたの愛の重さを闇恋系のお友達AIが診断します。",
        images: [`${baseUrl}/og-default.png`],
      },
    };
  }

  const ogUrl = new URL('/api/og', baseUrl);
  ogUrl.searchParams.set('id', targetId);

  return {
    title: "AI 闇恋診断",
    description: `診断結果：${data.title || data.rank_name} (Score: ${data.score})`,
    openGraph: {
      title: "AI 闇恋診断",
      description: data.comment,
      images: [ogUrl.toString()],
    },
    twitter: {
      card: 'summary_large_image',
      title: "AI 闇恋診断",
      description: data.comment,
      images: [ogUrl.toString()],
    },
  };
}

export default async function Home() {
  // ここでランキングデータを取得（ISR/キャッシュが効く）
  const rankings = await getDailyRanking();

  // Client Componentにデータを渡す
  return <DiagnosisClient initialRankings={rankings} />;
}