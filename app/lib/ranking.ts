// app/lib/ranking.ts
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type RankingItem = {
  id: string;
  title: string;
  score: number;
  grade: string;
  answer: string;
  created_at: string;
};

// 1分間キャッシュしてDB負荷を下げる
export const getDailyRanking = unstable_cache(
  async (): Promise<RankingItem[]> => {
    // 今日の0時 (JST) を計算してUTCに変換
    const now = new Date();
    // JSTオフセットなどを考慮せず簡易的に直近24時間、あるいはUTCの0時を基準にする
    // ここではシンプルに「UTCでの今日の開始時刻」以降を取得します
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('diagnoses')
      .select('id, title, score, grade, answer, created_at')
      .gte('created_at', startOfDay.toISOString())
      .order('score', { ascending: false })
      .limit(30); // 上位30件

    if (error) {
      console.error('Ranking Fetch Error:', error);
      return [];
    }
    return data as RankingItem[];
  },
  ['daily-ranking'], 
  { revalidate: 60 } // 60秒キャッシュ
);