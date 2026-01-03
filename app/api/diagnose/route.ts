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
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    // プロンプトに short_reviews の指示を追加
    const prompt = `
      あなたは「メンヘラ界の伝説的な師範代」です。
      以下のユーザーのLINEメッセージを解析し、メンヘラ度を診断してください。

      ## ユーザーの回答
      Q1(既読無視への追撃): ${q1}
      Q2(深夜のポエム): ${q2}
      Q3(浮気疑惑への牽制): ${q3}

      ## 出力ルール (JSON)
      - score: 0〜100の整数
      - title: 短い称号
      - chart: { "humidity": 0〜100, "pressure": 0〜100, "delusion": 0〜100 }
      - highlight_quote: 最も狂気を感じる一文を抜粋
      - comment: 師範代からの総評 (100文字程度)
      - short_reviews: ["Q1への辛辣な一言寸評", "Q2への辛辣な一言寸評", "Q3への辛辣な一言寸評"] 
        (配列として3つ必ず出力すること)
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const json: DiagnosisResult = JSON.parse(responseText);

    return NextResponse.json(json);

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "診断失敗" }, { status: 500 });
  }
}