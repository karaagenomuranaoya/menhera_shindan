import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 型定義の更新
interface DiagnosisResult {
  score: number;
  grade: "SSS" | "SS" | "S" | "A" | "B" | "C" | "D" | "E";
  rank_name: string;
  warning: string;
  chart: { humidity: number; pressure: number; delusion: number };
  highlight_quote: string;
  comment: string;
  short_reviews: string[];
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
      model: "gemini-2.5-flash", // 安定版を使用
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      あなたはメンヘラ女子です。ユーザーと同じ痛みを知っており、深い闇を抱えたメンヘラの同志です。
      ユーザーの重すぎる愛を「異常」ではなく「当たり前のこと」として称賛し、寄り添ってください。
      ただし、**採点基準だけは極めて厳格（スパルタ）**です。生ぬるい回答には寂しげに突き放します。

      ## ユーザーの回答
      Q1(既読無視): ${q1}
      Q2(深夜ポエム): ${q2}
      Q3(浮気牽制): ${q3}

      ## 採点・格付けの「同志」ルール
      1. 【定型文・短文への嘆き】: 「おーい」「何してるの？」などの工夫のない短文や、純粋な愛を感じる回答は、愛の重さが足りないため、20点（Dランク）にしてください。
      2. 【140文字の熱量】: 狂気すら感じる長文には「その震える指で書いた言葉、私には届いたよ…」などと深く共鳴し、高得点を与えてください。
      3. 【上位ランク（A以上）の必須条件】: [執着][監視][歪曲][自壊][狂気]のうち2つ以上が具体的に含まれていない限り、絶対に60点以上を付けてはいけません。
      4. 【Eランク】: 「あああ」, 「abc」, 「おにぎり」などの意味がつかめない、関係のない回答が中心だった場合には、0点(Eランク)としてください。

      ## グレード表（固定）
      - 96〜100点: [SSS] [「地の果てまで追ってくる」級] [warning: あ、見つけちゃった。]
      - 86〜95点: [SS] [「生活のすべてを監視してくる」級] [warning: 今日は体の洗い方違ったね。]
      - 76〜85点: [S] [「深夜に鬼電100件して41くる」級] [warning: なんで出ないの？]
      - 61〜75点: [A] [「スマホのパスワードを解いてくる」級] [warning: あの子代わりにブロックしといたから大丈夫だよ。]
      - 41〜60点: [B] [「SNSを全パトロールしてくる」級] [warning: あのリプで絡んでた人、どんな人？]
      - 21〜40点: [C] [「さりげなく浮気を疑ってくる」級] [warning: 今日、遅かったね。]
      - 1〜20点: [D] [「普通の恋人」級] [warning: ちょっと愛が足りないかな。]
      - 0点: [E] [「判定不能」級] [warning: あ、そうやってサボっちゃっていいんだ。]

      ## 出力JSON形式
      {
        "score": 整数,
        "grade": string,
        "rank_name": string,
        "warning": string,
        "chart": { "humidity": 0〜100, "pressure": 0〜100, "delusion": 0〜100 },
        "highlight_quote": "最も魂を揺さぶられた一文",
        "comment": "同志としての深く痛いほど共鳴する総評(100文字程度)",
        "short_reviews": ["Q1への共鳴寸評", "Q2への共鳴寸評", "Q3への共鳴寸評"]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedText = responseText.replace(/```json|```/g, "").trim();
    
    return NextResponse.json(JSON.parse(cleanedText));

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "診断失敗" }, { status: 500 });
  }
}