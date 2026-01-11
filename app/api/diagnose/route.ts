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

// 画像URLマッピング (Gradeは画像決定キーとしてのみ使用)
const RANK_IMAGE_URLS: Record<string, string> = {
  "GOD": `${BASE_STORAGE_URL}/GOD.png`,
  "S": `${BASE_STORAGE_URL}/S.png`,
  "A": `${BASE_STORAGE_URL}/A.png`,
  "B": `${BASE_STORAGE_URL}/B.png`,
  "C": `${BASE_STORAGE_URL}/C.png`,
  "Z": `${BASE_STORAGE_URL}/Z.png`,
  "Error": `${BASE_STORAGE_URL}/error.png`,
};

// レートリミッター
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://yamikoi-shindan.vercel.app",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "dummy",
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

// 型定義 (DB構造に合わせる)
interface DiagnosisResult {
  score: number;
  grade: string;
  title: string; // 旧 rank_name
  pick_up_phrase: string;
  comment: string;
  reasoning?: string; // JSONには含めるがDBには保存しない
}

export async function POST(req: Request) {
  const createErrorData = () => ({
    score: 0,
    grade: "Error",
    title: "システムダウン級",
    pick_up_phrase: "愛が重すぎる...",
    comment: "計測不能。あなたの愛がサーバーを焼き切ったみたい。少し休ませて。",
  });

  let answer = "";
  // questionはDB保存しないが、AIへのコンテキストとして受け取る
  let question = ""; 
  let diagnosisResult: DiagnosisResult | null = null;

  try {
    const body = await req.json();
    question = body.question || "";
    answer = body.answer || "";
    const charCount = answer.length;

    // レートリミット
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

        // 学習データの構築
        let examplesText = "";
        const allExamples = [...judgementData];

        if (allExamples.length > 0) {
          examplesText = "## 参考データ（このテンションを真似て、さらにインフレさせよ）\n";
          allExamples.forEach((ex) => {
            const outputExample = {
              reasoning: (ex as any).reasoning, // 思考プロセスは例示する
              score: ex.score,
              grade: ex.grade,
              title: ex.title,
              pick_up_phrase: ex.pick_up_phrase,
              comment: ex.comment
            };
            examplesText += `Input: ${ex.answer}\nOutput: ${JSON.stringify(outputExample)}\n---\n`;
          });
        }

        // プロンプト
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
          3. **Title (称号) の生成**:
             - 「S級」のような記号ではなく、その回答の狂気を表す「二つ名（異名）」をつけてください。
             - 例：「銀河を喰らう愛のブラックホール」「呼吸する監禁部屋」「歩く婚姻届」など。
          4. **Grade基準**:
             - **Grade C**: (Score: ~9,999) 
             - **Grade B**: (Score: ~99,999) 
             - **Grade A**: (Score: ~499,999) 
             - **Grade S**: (Score: ~9,999,999) 
             - **Grade GOD**: (Score: 10,000,000~)

          ## 出力JSON形式
          {
            "score": 整数 (インフレさせた数値),
            "grade": "GOD" | "S" | "A" | "B" | "C",
            "title": "その回答固有の、中二病全開のユニークな称号",
            "pick_up_phrase": "ユーザーの回答の中から、最も狂気を感じる、または面白い『パンチライン（決め台詞）』を20文字以内で抜粋してください。要約ではなく、原文のまま抜き出すこと。",
            "comment": "ユーザーの回答を引用しつつ、狂気的なテンションで全肯定・称賛するコメント(150文字程度)。",
            "reasoning": "なぜこの高得点になったかのポジティブな分析（思考用）"
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
        if (!validGrades.includes(finalGrade)) {
           if (parsed.score >= 10000000) finalGrade = "GOD";
           else if (parsed.score >= 100000) finalGrade = "S";
           else if (parsed.score >= 10000) finalGrade = "A";
           else finalGrade = "B";
        }

        diagnosisResult = {
          reasoning: parsed.reasoning || "解析不能",
          score: parsed.score || 0,
          grade: finalGrade,
          title: parsed.title || "名もなき怪物",
          pick_up_phrase: parsed.pick_up_phrase || (answer.length > 20 ? answer.substring(0, 19) + "..." : answer),
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

    const selectedImageUrl = RANK_IMAGE_URLS[diagnosisResult.grade] || RANK_IMAGE_URLS["Error"];

    // DB保存（warning, questionは保存しない）
    const { data: dbData, error: dbError } = await supabase
      .from("diagnoses")
      .insert({
        answer: answer || "不明",
        score: diagnosisResult.score,
        grade: diagnosisResult.grade,
        title: diagnosisResult.title, // カラム名変更対応
        pick_up_phrase: diagnosisResult.pick_up_phrase,
        comment: diagnosisResult.comment,
        image_url: selectedImageUrl
        // reasoningは保存しない
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