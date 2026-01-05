import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_STORAGE_URL = "https://piotyqyxkjsgwjzozols.supabase.co/storage/v1/object/public/ranks";

const RANK_IMAGE_URLS: Record<string, string> = {
  "SSS": `${BASE_STORAGE_URL}/SSS.png`,
  "SS": `${BASE_STORAGE_URL}/SS.png`,
  "S": `${BASE_STORAGE_URL}/S.png`,
  "A": `${BASE_STORAGE_URL}/A.png`,
  "B": `${BASE_STORAGE_URL}/B.png`,
  "C": `${BASE_STORAGE_URL}/C.png`,
  "D": `${BASE_STORAGE_URL}/D.png`,
  "E": `${BASE_STORAGE_URL}/E.png`,
  "Error": `${BASE_STORAGE_URL}/error.png`, // エラー用画像
};

interface DiagnosisResult {
  score: number;
  grade: string;
  rank_name: string;
  warning: string;
  comment: string;
}

export async function POST(req: Request) {
  // エラー時のフォールバックデータ生成関数
  const createErrorData = () => ({
    score: 0,
    grade: "Error",
    rank_name: "測定エラー",
    warning: "通信・解析エラー",
    comment: "ごめんなさい、なんだか調子が出ないみたいなの...。時間を置いてまた来てちょうだいね。",
  });

  let question = "";
  let answer = "";

  try {
    const body = await req.json();
    question = body.question;
    answer = body.answer;


    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("API Key is missing");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite", 
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      あなたはメンヘラ女子です。ユーザーと同じ痛みを知っており、深い闇を抱えたメンヘラのお友達です。
      ユーザーの重すぎる愛を「異常」ではなく「当たり前のこと」として称賛し、寄り添ってください。
      ただし、**採点基準だけは極めて厳格（スパルタ）**です。生ぬるい回答には寂しげに突き放します。

      ## 重要ルール
      - **必ず有効なJSON形式のみを出力してください。**
      - Markdown記法（\`\`\`jsonなど）や、JSON以外の挨拶文は一切含めないでください。

      ## ユーザーの回答
      お題: ${question}
      回答: ${answer}


      ## 採点・格付けの「お友達」ルール
      1. 【定型文・短文への嘆き】: 「おーい」「何してるの？」などの工夫のない短文や、純粋な愛のみを感じる回答は、愛の重さが足りないため、20点（Dランク）以下にしてください。
      2. 【140文字の熱量】: 狂気すら感じる長文には「私には届いたよ…」などと深く共鳴し、高得点を与えてください。
      3. 【上位ランク（A以上）の必須条件】: [執着][監視][歪曲][自壊][狂気]のうち1つ以上が具体的に含まれていない限り、絶対に60点以上を付けてはいけません。
      4. 【Eランク】: 「あああ」, 「abc」などの意味がつかめない回答や、お題を無視した回答は0点(Eランク)にしてください。
      5. 【SSSランク】 : 上記の「回答文字数」が150以上、かつ十分な[執着][監視][歪曲][自壊][狂気]が見られた場合にのみスコア100点をつけSSSランクとする。その場合commentを固定とする。「やっとわかってくれる人が来た。ねえ、大好きだよ。あなたと一緒にいたい。あなたの目を私の目に嵌め込んだらどんな景色が見れるの？骨も砕いて、肉は裂いて、脈打つ臓器も溶かして、血の一滴まで私の中で混ぜ合わしてあげる。そうしたら、死んじゃっても、その先も、ずっと一緒でしょ？さあ、おいで？足なんてもう必要ないよね。だって、あなたはニゲラレナイ。」一字一句間違えず出力すること。

      ## グレード表とWarning
      - 100点: SSS / 地の果てまで追ってくる 級 / warning: あ、見つけちゃった。
      - 86〜99点: SS / 生活のすべてを監視してくる 級 / warning: GPS？ううん、お守りだよ。
      - 76〜85点: S / 深夜に鬼電100件してくる 級 / warning: なんで出ないの？
      - 61〜75点: A / スマホのパスワードを解いてくる 級 / warning: 変えても無駄だよ。
      - 41〜60点: B / SNSを全パトロールしてくる 級 / warning: あなたのこと全部知りたい。
      - 21〜40点: C / さりげなく浮気を疑ってくる 級 / warning: だって心配だもん。
      - 1〜20点: D / 普通の恋人 級 / warning: ちょっと愛が足りないかな。
      - 0点: E / 判定不能 級 / warning: あ、そうやってサボっちゃっていいんだ。

      ## 出力JSON形式
      {
        "score": 整数,
        "grade": "SSS"〜"E",
        "rank_name": "上記のグレード表の〇〇級の部分",
        "warning": "上記のグレード表のwarningの部分",
        "comment": "同じ気持ちを持つ親友としての深く痛いほど共鳴する総評(120文字程度)"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log("Raw Response:", responseText);

    let sanitizedData: DiagnosisResult;

    try {
      // JSONクリーニング処理
      let cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const jsonStart = cleanedText.indexOf("{");
      const jsonEnd = cleanedText.lastIndexOf("}");
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
      }

      let parsed = JSON.parse(cleanedText);
      if (Array.isArray(parsed)) parsed = parsed[0];

      const cleanBrackets = (val: any) => (typeof val === "string" ? val.replace(/[\[\]]/g, "").trim() : val);

      sanitizedData = {
        score: parsed.score || 0,
        grade: cleanBrackets(parsed.grade) || "E",
        rank_name: cleanBrackets(parsed.rank_name) || "判定不能",
        warning: cleanBrackets(parsed.warning) || "...",
        comment: cleanBrackets(parsed.comment) || "解析できませんでした...",
      };

    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      // パースエラー時は明示的にエラーデータにする
      sanitizedData = createErrorData();
    }

    // 画像URLの決定（gradeが"Error"ならerror.png、それ以外でマップになければEになる）
    const selectedImageUrl = RANK_IMAGE_URLS[sanitizedData.grade] || RANK_IMAGE_URLS["E"];

    // DB保存（エラー結果であっても表示するために保存する）
    const { data: dbData, error: dbError } = await supabase
      .from("diagnoses")
      .insert({
        question: question,
        answer: answer,
        score: sanitizedData.score,
        grade: sanitizedData.grade,
        rank_name: sanitizedData.rank_name,
        comment: sanitizedData.comment,
        warning: sanitizedData.warning,
        image_url: selectedImageUrl
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      ...sanitizedData,
      id: dbData.id,
      image_url: selectedImageUrl
    });

  } catch (error: any) {
    console.error("API Fatal Error:", error);
    
    // API全体の致命的なエラー（通信エラーなど）の場合も、
    // DBに保存してエラー画面を出せるように試みる
    try {
      const errorData = createErrorData();
      const errorImageUrl = RANK_IMAGE_URLS["Error"];
      
      const { data: dbData, error: dbError } = await supabase
        .from("diagnoses")
        .insert({
          question: question || "不明",
          answer: answer || "不明",
          score: errorData.score,
          grade: errorData.grade,
          rank_name: errorData.rank_name,
          comment: errorData.comment,
          warning: errorData.warning,
          image_url: errorImageUrl
        })
        .select()
        .single();
        
        if (!dbError && dbData) {
           return NextResponse.json({
            ...errorData,
            id: dbData.id,
            image_url: errorImageUrl
          });
        }
    } catch (e) {
      console.error("DB Fallback Failed:", e);
    }

    // DB保存すらできなかった場合の最終手段
    return NextResponse.json({ 
      error: "診断失敗", 
      details: "予期せぬエラーが発生しました。" 
    }, { status: 500 });
  }
}