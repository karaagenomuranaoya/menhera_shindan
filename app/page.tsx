import { Metadata } from 'next';
import DiagnosisClient from './DiagnosisClient';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ★ここに指定の最強IDを定義（ここを書き換えるだけで憑依先が変わります）
const DEFAULT_ID = 'b3dfe464-a323-47f6-a4b7-ccadbb176a58';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { id } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yamikoi-shindan.vercel.app';

  // IDが指定されていればそれを、なければ最強IDを使用
  const targetId = (typeof id === 'string' ? id : DEFAULT_ID);

  // DBからデータ取得
  const { data } = await supabase.from('diagnoses').select('*').eq('id', targetId).single();

  // 万が一デフォルトIDすらDBにない場合の保険（汎用画像へ）
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

  // OGP画像のURLを生成
  const ogUrl = new URL('/api/og', baseUrl);
  ogUrl.searchParams.set('id', targetId);

  return {
    title: "AI 闇恋診断",
    description: `診断結果：${data.rank_name} (Score: ${data.score})`,
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

export default function Home() {
  return <DiagnosisClient />;
}