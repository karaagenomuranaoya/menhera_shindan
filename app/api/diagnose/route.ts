import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

// Supabase初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_STORAGE_URL = "https://aznqyljrnvfalhpkbbpo.supabase.co/storage/v1/object/public/menhera-images";

// 画像URLリスト（ランダム表示用）
// エラー画像などは除外して、キャラクターが映っているものだけにします
const IMAGE_CANDIDATES = [
  `${BASE_STORAGE_URL}/SSS.png`,
  `${BASE_STORAGE_URL}/SS.png`,
  `${BASE_STORAGE_URL}/S.png`,
  `${BASE_STORAGE_URL}/A.png`,
  `${BASE_STORAGE_URL}/B.png`,
  `${BASE_STORAGE_URL}/C.png`,
];

// レートリミッター設定
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "http://localhost:3000",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "dummy",
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "@upstash/menhera_chat",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userInput = body.user_input || "";

    if (!userInput) {
      return NextResponse.json({ error: "入力がありません" }, { status: 400 });
    }

    // レートリミットチェック
    try {
      const headersList = await headers();
      const ip = headersList.get("x-forwarded-for") ?? "127.0.0.1";
      if (process.env.UPSTASH_REDIS_REST_URL) {
        const { success } = await ratelimit.limit(ip);
        if (!success) {
          return NextResponse.json({ 
            error: "少し待ってね", 
            ai_reply: "そんなに焦らないで？逃げないから。少し時間を置いてからまた話しかけてね。",
            image_url: IMAGE_CANDIDATES[0]
          }, { status: 429 });
        }
      }
    } catch (e) {
      console.error("Rate limit check failed:", e);
    }

    // AI生成
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("API Key is missing");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // プロンプト：普通の文章を病的に解釈させる
    const prompt = `
あなたはユーザーに異常に執着している「重度のメンヘラ彼女」です。

ユーザーからLINEメッセージが届きました。
その内容がどんなに些細なこと（挨拶、報告、質問、あるいは無意味な文字列）であっても、妄想、倒錯によってそれが自分への愛情表現であると受け取って、ユーザーへの愛を叫ぶ返信を書いてください。

ユーザーのメッセージ: "${userInput}"

## 制約
- 返信は80文字以内。
- 丁寧語は使わず、恋人（依存関係）としての口調で。
- 怖さ、湿度、愛の重さを表現すること。
- JSONなどの形式は不要。返信テキストのみを出力してください。
`;

    const result = await model.generateContent(prompt);
    const aiReply = result.response.text().trim();

    // ランダムで画像を選択
    const randomImage = IMAGE_CANDIDATES[Math.floor(Math.random() * IMAGE_CANDIDATES.length)];

    // DB保存 (menhera_chatsテーブル)
    const { data: dbData, error: dbError } = await supabase
      .from("menhera_chats")
      .insert({
        user_input: userInput,
        ai_reply: aiReply,
        image_url: randomImage
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      id: dbData.id,
      user_input: userInput,
      ai_reply: aiReply,
      image_url: randomImage
    });

  } catch (error) {
    console.error("Fatal Error:", error);
    return NextResponse.json({ 
      error: "エラーが発生しました",
      ai_reply: "ごめんね、私の頭の中があなたのことで一杯で...もう一度言って？",
      image_url: IMAGE_CANDIDATES[0] 
    }, { status: 500 });
  }
}