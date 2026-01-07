import { Metadata } from 'next';
import DiagnosisClient from './DiagnosisClient';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントの初期化（サーバーサイド用）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// 動的にメタデータを生成
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  // URLの ?id=... を取得
  const { id } = await searchParams;

  // ベースのURL（環境変数かlocalhost）
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yamikoi-shindan.vercel.app/';

  // デフォルトのメタデータ（IDがない場合）
  const defaultMetadata = {
    title: "AI 闇恋診断",
    description: "あなたの愛の重さを闇恋系のお友達AIが診断します。",
    openGraph: {
      title: "AI 闇恋診断",
      description: "あなたの愛の重さを闇恋系のお友達AIが診断します。",
      images: [`${baseUrl}/og-default.png`], // デフォルト画像（publicに置く）
    },
  };

  // IDがないならデフォルトを返す
  if (!id || typeof id !== 'string') return defaultMetadata;

  // IDがあるならDBから結果を取得して、OGP画像を差し替える
  const { data } = await supabase.from('diagnoses').select('*').eq('id', id).single();

  if (!data) return defaultMetadata;

  // 動的OGP画像のURLを作成
  const ogUrl = new URL('/api/og', baseUrl);
  ogUrl.searchParams.set('id', id);

  return {
    title: "AI 闇恋診断",
    description: `診断結果：${data.rank_name} (Score: ${data.score})`,
    openGraph: {
      title: "AI 闇恋診断",
      description: data.comment,
      images: [ogUrl.toString()], // ★ここが個別の結果画像になる
    },
    twitter: {
      card: 'summary_large_image',
      title: "AI 闇恋診断",
      description: data.comment,
      images: [ogUrl.toString()],
    },
  };
}

export default function Home() {
  return <DiagnosisClient />;
}