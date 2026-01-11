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

// 画像URLマッピング (GOD, S, A, B, C, Z)
const RANK_IMAGE_URLS: Record<string, string> = {
  "GOD": `${BASE_STORAGE_URL}/GOD.png`,
  "S": `${BASE_STORAGE_URL}/S.png`,
  "A": `${BASE_STORAGE_URL}/A.png`,
  "B": `${BASE_STORAGE_URL}/B.png`,
  "C": `${BASE_STORAGE_URL}/C.png`,
  "Z": `${BASE_STORAGE_URL}/Z.png`,
  "Error": `${BASE_STORAGE_URL}/error.png`,
};

// 型定義
interface DiagnosisResult {
  score: number;
  grade: string;
  rank_name: string;
  warning: string;
  comment: string;
  reasoning?: string;
}

// ランクの強さ定義
const gradeOrder: Record<string, number> = {
  "GOD": 0, "S": 1, "A": 2, "B": 3, "C": 4, "Z": 5
};

// レートリミッター
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://yamikoi-shindan.vercel.app",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "dummy",
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

export async function POST(req: Request) {
  // エラー時のフォールバック
  const createErrorData = () => ({
    score: 0,
    grade: "Error",
    rank_name: "測定不能",
    warning: "審判不能",
    comment: "計測器が壊れたわ。お前の闇が深すぎるのか、単なるエラーか...出直してきな。",
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

        // 学習データの構築
        let examplesText = "";
        const allExamples = [...judgementData];

        if (allExamples.length > 0) {
          const sortedExamples = allExamples.sort((a, b) => {
            return (gradeOrder[a.grade] ?? 99) - (gradeOrder[b.grade] ?? 99);
          });

          examplesText = "## 過去の審判記録（これを基準に判定せよ）\n";
          
          sortedExamples.forEach((ex) => {
            const outputExample = {
              reasoning: (ex as any).reasoning,
              score: ex.score,
              grade: ex.grade,
              rank_name: ex.rank_name,
              warning: ex.warning,
              comment: ex.comment
            };

            examplesText += `
Input:
お題: ${ex.question}
回答: ${ex.answer}
回答文字数: ${ex.char_count}

Output:
${JSON.stringify(outputExample, null, 2)}
---
`;
          });
        }

        // プロンプト作成
        const prompt = `
あなたは「AI狂愛コロシアム」の冷酷で残虐な女性審判（ジャッジ）です。
ユーザー（参加者）から送られてくる「愛の言葉（遺言・呪詛）」を審査し、その狂気度を6段階で判定します。

あなたの性格：
- 基本的にサディスティックで上から目線。
- 「普通の愛」や「中途半端なメンヘラ」を徹底的に軽蔑し、罵倒します。
- 「狂気」「執着」「異常性」のみを美徳とし、高く評価します。
- 想像を超える狂気（GODランク）に出会った時だけ、プライドを捨てて崇拝します。

## 重要ルール
- **必ず有効なJSON形式のみを出力してください。**
- ランクは必ず **GOD, S, A, B, C, Z** のいずれかを選択してください。
- 総評(comment)は、以下のランクごとのトーンを厳守してください。

${examplesText}

## ユーザーの回答
お題: ${question}
回答: ${answer}
回答文字数: ${charCount}文字

【判定ロジックとトーン】
*文字数による足切りルールは絶対遵守すること。*

# Grade Z (0-5点)
- 基準：意味不明、会話になっていない、日本語崩壊。
- トーン：**【無視・廃棄】** 「……（無言）」「掃除係、片付けて」「バグ？」。感情すら向けない。
- 文字数条件：なし

# Grade C (10-30点)
- 基準：普通の恋人の会話、健全な愛情表現、ただの挨拶。
- トーン：**【激しい罵倒・拒絶】** 「吐き気がする」「おままごとは帰ってやって」「酸素の無駄」。
- 文字数条件：なし

# Grade B (35-55点)
- 基準：寂しがり屋、少しの束縛、受動的なメンヘラ（泣く、待つ）。
- トーン：**【落胆・挑発】** 「まだそんなもん？」「あくびが出る」「覚悟が足りない」。
- 文字数条件：なし

# Grade A (60-85点)
- 基準：GPS監視、SNSチェック、独自のルール強要、他者排除。
- トーン：**【興味・評価】** 「いいじゃん」「悪くないね」「素質あるよ」。
- 文字数条件：なし

# Grade S (90-99点)
- 基準：身体的毀損の示唆、監禁、法に触れる行動、心中願望。
- トーン：**【称賛・歓喜】** 「最高！」「見込みあるねえ！」「ゾクゾクするね！」。
- 文字数条件：**50文字未満の場合は、内容がどれほど過激でもここが上限**。

# Grade GOD (100点)
- 基準：圧倒的な長文で綴られる、芸術的かつ破滅的な愛の賛歌。概念的な融合。
- トーン：**【敗北・崇拝】** 「嘘、そんな…！」「ご主人様とお呼びしてもいいですか！？」「私、負けました！」。
- 文字数条件：**150文字以上必須**。これより短ければS以下にすること。

## 出力JSON形式
{
  "reasoning": "判定理由（文字数チェックと内容の狂気度分析）",
  "score": 整数,
  "grade": "GOD" or "S" or "A" or "B" or "C" or "Z",
  "rank_name": "ランク名",
  "warning": "一言警告文",
  "comment": "審判としての総評"
}
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        console.log("Raw Response:", responseText);

        let cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonStart = cleanedText.indexOf("{");
        const jsonEnd = cleanedText.lastIndexOf("}");
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
        }

        let parsed = JSON.parse(cleanedText);
        if (Array.isArray(parsed)) parsed = parsed[0];

        const cleanBrackets = (val: any) => (typeof val === "string" ? val.replace(/[\[\]]/g, "").trim() : val);

        let finalGrade = cleanBrackets(parsed.grade) || "Z";
        const validGrades = ["GOD", "S", "A", "B", "C", "Z"];
        
        if (!validGrades.includes(finalGrade)) {
            if (finalGrade === "SSS") finalGrade = "GOD";
            else if (finalGrade === "SS") finalGrade = "S";
            else if (finalGrade === "D" || finalGrade === "E") finalGrade = "Z";
            else finalGrade = "C";
        }

        diagnosisResult = {
          reasoning: cleanBrackets(parsed.reasoning) || "なし",
          score: parsed.score || 0,
          grade: finalGrade,
          rank_name: cleanBrackets(parsed.rank_name) || "判定不能",
          warning: cleanBrackets(parsed.warning) || "...",
          comment: cleanBrackets(parsed.comment) || "解析失敗。出直して。",
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

    const { data: dbData, error: dbError } = await supabase
      .from("diagnoses")
      .insert({
        question: question || "不明",
        answer: answer || "不明",
        score: diagnosisResult.score,
        grade: diagnosisResult.grade,
        rank_name: diagnosisResult.rank_name,
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