import { Metadata } from 'next';
import DiagnosisClient from './DiagnosisClient';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { id } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const defaultMetadata = {
    title: "AI メンヘラ解釈",
    description: "あなたが送る普通のメッセージを、メンヘラAIが「愛」か「裏切り」に勝手に超解釈して返信します。",
    openGraph: {
      title: "AI メンヘラ解釈",
      description: "普通の言葉が、狂気の愛に変換される。",
      images: [`${baseUrl}/og-default.png`], 
    },
  };

  if (!id || typeof id !== 'string') return defaultMetadata;

  // IDがある場合はその結果をOGPにする
  const { data } = await supabase.from('menhera_chats').select('*').eq('id', id).single();
  if (!data) return defaultMetadata;

  const ogUrl = new URL('/api/og', baseUrl);
  ogUrl.searchParams.set('id', id);

  return {
    title: "AI メンヘラ解釈",
    description: `彼女からの返信: ${data.ai_reply.substring(0, 50)}...`,
    openGraph: {
      title: "AI メンヘラ解釈",
      description: data.ai_reply,
      images: [ogUrl.toString()],
    },
    twitter: {
      card: 'summary_large_image',
      title: "AI メンヘラ解釈",
      description: data.ai_reply,
      images: [ogUrl.toString()],
    },
  };
}

export default function Home() {
  return <DiagnosisClient />;
}