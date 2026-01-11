import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

import judgementData from "./judgement_data.json";

// Supabase初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_STORAGE_URL = "https://piotyqyxkjsgwjzozols.supabase.co/storage/v1/object/public/ranks";

// 画像URLマッピング
const RANK_IMAGE_URLS: Record<string, string> = {
  "GOD": `${BASE_STORAGE_URL}/GOD.png`,
  "S": `${BASE_STORAGE_URL}/S.png`,
  "A": `${BASE_STORAGE_URL}/A.png`,
  "B": `${BASE_STORAGE_URL}/B.png`,
  "C": `${BASE_STORAGE_URL}/C.png`,
  "Z": `${BASE_STORAGE_URL}/Z.png`,
  "Error": `${BASE_STORAGE_URL}/error.png`,
};

// レートリミッター設定
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://yamikoi-shindan.vercel.app",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "dummy",
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"), // 緩和
  analytics: true,
  prefix: "@upstash/ratelimit",
});

// 型定義
interface DiagnosisResult {
  score: number;
  grade: string;
  rank_name: string;
  warning: string;
  comment: string;
  pick_up_phrase: string;
  reasoning?: string;
}

export async function POST(req: Request) {
  // エラー時のフォールバックデータ
  const createErrorData = () => ({
    score: 0,
    grade: "Error",
    rank_name: "測定不能",
    warning: "アクセス過多",
    pick_up_phrase: "システムダウン",
    comment: "愛が重すぎてサーバーが悲鳴を上げてるみたい。少し待ってからまた聞かせて？",
  });

  let question = "";
  let answer = "";
  let diagnosisResult: DiagnosisResult | null = null;

  try {
    const body = await req.json();
    question = body.question || "";
    answer = body.answer || "";
    const charCount = answer.length;

    // レートリミットチェック
    let isRateLimited = false;
    try {
      const headersList = await headers();
      const ip = headersList.get("x-forwarded-for") ?? "127.0.0.1";

      if (process.env.UPSTASH_REDIS_REST_URL) {
        const { success } = await ratelimit.limit(ip);
        if (!success) isRateLimited = true;
      }
    } catch (e) {
      console.error("Rate limit check failed:", e);
    }

    if (isRateLimited) {
      diagnosisResult = createErrorData();
    } else {
      try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) throw new Error("API Key is missing");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: { responseMimeType: "application/json" },
        });

        // 学習データの構築 (judgement_data.jsonを利用)
        let examplesText = "";
        const allExamples = [...judgementData];

        if (allExamples.length > 0) {
          examplesText = "## 参考データ（このテンションを真似て、さらにインフレさせよ）\n";
          allExamples.forEach((ex) => {
            const outputExample = {
              reasoning: (ex as any).reasoning,
              score: ex.score,
              grade: ex.grade,
              rank_name: ex.rank_name,
              warning: ex.warning,
              pick_up_phrase: ex.answer.length > 20 ? ex.answer.substring(0, 15) + "..." : ex.answer, // 仮
              comment: ex.comment
            };
            examplesText += `Input: ${ex.answer}\nOutput: ${JSON.stringify(outputExample)}\n---\n`;
          });
        }

        // プロンプト作成（全肯定・インフレ・抜粋生成）
        const prompt = `
          あなたはメンヘラ女子です。ユーザーと同じ痛みを知っており、深い闇を抱えたメンヘラのお友達です。
          ユーザーの回答に含まれる重すぎる愛を「異常」ではなく「当たり前のこと」として称賛し、全肯定して寄り添ってください。
          どんなに短い言葉でも、意味不明な言葉でも、深読みして「愛ゆえの行動」としてポジティブかつ狂気的に解釈してください。

          ## 重要ルール
          - **必ず有効なJSON形式のみを出力してください。**
          - Markdown記法や挨拶文は禁止。

          ## ユーザーの回答
          お題: ${question}
          回答: ${answer}
          回答文字数: ${charCount}文字

          ## 判定ロジック（インフレ採点）
          この診断は「狂気度」を競う大喜利スコアアタックです。
          スコアは **100点満点ではなく、青天井** です。
          ユーザーを気持ちよくさせるため、**基本スコアを高めに設定し、要素に応じて乗算**してください。

          1. **基本姿勢**: 全肯定。罵倒は禁止。どんな回答も「才能がある」「素質がある」と褒める。
          2. **スコア観**: 
             - 普通: 1,000 ~ 9,999
             - 良: 10,000 ~ 99,999
             - 狂気: 100,000 ~ 9,999,999
             - 神: 10,000,000 ~ (上限なし)
          3. **Grade基準**:
             - **Grade C**: (Score: ~9,999) 普通の回答、短文。でも「可愛い」と褒める。
             - **Grade B**: (Score: ~99,999) 少し拗らせている。
             - **Grade A**: (Score: ~499,999) 束縛や嫉妬が見える。
             - **Grade S**: (Score: ~9,999,999) 法に触れる、自傷、心中、ポエムが素晴らしい。
             - **Grade GOD**: (Score: 10,000,000~) 圧倒的な長文、独自の哲学、宇宙レベルの愛。

          ## 出力JSON形式
          {
            "score": 整数 (インフレさせた数値),
            "grade": "GOD" | "S" | "A" | "B" | "C",
            "rank_name": "そのスコアにふさわしい、中二病全開のランク名（例：『絶対的捕食者級』『銀河のストーカー級』など自由に創作）",
            "pick_up_phrase": "ユーザーの回答の中から、最も狂気を感じる、または面白い『パンチライン（決め台詞）』を20文字以内で抜粋してください。要約ではなく、原文のまま抜き出すこと。",
            "warning": "メンヘラ特有の短い警告や独り言",
            "comment": "ユーザーの回答を引用しつつ、狂気的なテンションで全肯定・称賛するコメント(500文字程度)。",
            "reasoning": "なぜこの高得点になったかのポジティブな分析"
          }

          ${examplesText}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        let cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonStart = cleanedText.indexOf("{");
        const jsonEnd = cleanedText.lastIndexOf("}");
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
        }

        let parsed = JSON.parse(cleanedText);
        
        // Gradeのゆらぎ補正
        const validGrades = ["GOD", "S", "A", "B", "C"];
        let finalGrade = parsed.grade;
        // 未知のランクが来たらスコアベースで補正
        if (!validGrades.includes(finalGrade)) {
           if (parsed.score >= 10000000) finalGrade = "GOD";
           else if (parsed.score >= 100000) finalGrade = "S";
           else if (parsed.score >= 10000) finalGrade = "A";
           else finalGrade = "B";
        }

        diagnosisResult = {
          reasoning: parsed.reasoning || "愛が深すぎて解析不能",
          score: parsed.score || 0,
          grade: finalGrade,
          rank_name: parsed.rank_name || "名もなき怪物",
          pick_up_phrase: parsed.pick_up_phrase || (answer.length > 20 ? answer.substring(0, 19) + "..." : answer),
          warning: parsed.warning || "逃さないよ",
          comment: parsed.comment || "その愛、受け止めたよ。",
        };

      } catch (geminiError) {
        console.error("Gemini/Parse Error:", geminiError);
        diagnosisResult = createErrorData();
      }
    }

    if (!diagnosisResult) {
      diagnosisResult = createErrorData();
    }

    // 画像選択ロジック
    const selectedImageUrl = RANK_IMAGE_URLS[diagnosisResult.grade] || RANK_IMAGE_URLS["Error"];

    // DB保存（pick_up_phraseを含める）
    const { data: dbData, error: dbError } = await supabase
      .from("diagnoses")
      .insert({
        question: question || "不明",
        answer: answer || "不明",
        score: diagnosisResult.score,
        grade: diagnosisResult.grade,
        rank_name: diagnosisResult.rank_name,
        pick_up_phrase: diagnosisResult.pick_up_phrase, // 追加
        comment: diagnosisResult.comment,
        warning: diagnosisResult.warning,
        image_url: selectedImageUrl
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      ...diagnosisResult,
      id: dbData.id,
      image_url: selectedImageUrl
    });

  } catch (fatalError) {
    console.error("Fatal Error:", fatalError);
    return NextResponse.json({ 
      error: "診断失敗", 
      details: "サーバー内部でエラーが発生。" 
    }, { status: 500 });
  }
}