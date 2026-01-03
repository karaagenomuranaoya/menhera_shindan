import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 型定義に short_reviews を追加
interface DiagnosisResult {
  score: number;
  title: string;
  chart: { humidity: number; pressure: number; delusion: number };
  highlight_quote: string;
  comment: string;
  short_reviews: string[]; // ← 追加: 文字列の配列
}

export async function POST(req: Request) {
  try {
    const { q1, q2, q3 } = await req.json();
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key is missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    // プロンプトに short_reviews の指示を追加
    const prompt = `
      あなたは「メンヘラ界のカリスマ」です。
      以下のユーザーのLINEメッセージを解析し、メンヘラ度を厳しく診断してください。

      ## ユーザーの回答
      Q1(既読無視への追撃): ${q1}
      Q2(深夜のポエム): ${q2}
      Q3(浮気疑惑への牽制): ${q3}

      ## 出力ルール (JSON)
      - score: 0〜100の整数（厳しくつける。意味をなさないものにはメンヘラを舐めるなと言わんばかりに躊躇なく0点をつける。一方で心と闇のこもったメンヘラには高得点をつける。）
      - title: 短い称号
      - chart: { "humidity": 0〜100, "pressure": 0〜100, "delusion": 0〜100 }
      - highlight_quote: 最も狂気を感じる一文を抜粋
      - comment: カリスマからの総評 (100文字程度)
      - short_reviews: ["Q1への辛辣な一言寸評", "Q2への辛辣な一言寸評", "Q3への辛辣な一言寸評"] 
        (配列として3つ必ず出力すること)
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // --- 修正箇所: Markdown記号(```json ... ```)を取り除く処理 ---
    const cleanedText = responseText.replace(/```json|```/g, "").trim();
    
    let json: DiagnosisResult;
    try {
      json = JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON Parse Error:", responseText);
      return NextResponse.json({ error: "AIの応答形式エラー" }, { status: 500 });
    }
    // -----------------------------------------------------------

    return NextResponse.json(json);

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "診断失敗" }, { status: 500 });
  }
}