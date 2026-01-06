import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

// ▼▼▼ 学習データをインポート ▼▼▼
import judgementData from "./judgement_data.json";
import cornerCases from "./corner_cases.json"; 

// Supabase初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_STORAGE_URL = "https://piotyqyxkjsgwjzozols.supabase.co/storage/v1/object/public/ranks";

// 画像URLマッピング
const RANK_IMAGE_URLS: Record<string, string> = {
  "SSS": `${BASE_STORAGE_URL}/SSS.png`,
  "SS": `${BASE_STORAGE_URL}/SS.png`,
  "S": `${BASE_STORAGE_URL}/S.png`,
  "A": `${BASE_STORAGE_URL}/A.png`,
  "B": `${BASE_STORAGE_URL}/B.png`,
  "C": `${BASE_STORAGE_URL}/C.png`,
  "D": `${BASE_STORAGE_URL}/D.png`,
  "E": `${BASE_STORAGE_URL}/E.png`,
  "Error": `${BASE_STORAGE_URL}/error.png`,
};

interface DiagnosisResult {
  score: number;
  grade: string;
  rank_name: string;
  warning: string;
  comment: string;
}

// ランクの並び順定義（ソート用）
const gradeOrder: Record<string, number> = {
  "SSS": 0, "SS": 1, "S": 2, "A": 3, "B": 4, "C": 5, "D": 6, "E": 7
};

// レートリミッター
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "http://localhost:3000",
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
    rank_name: "測定エラー",
    warning: "リクエスト過多・解析不能",
    comment: "ごめんなさい、たくさんの方とお話しして少し疲れちゃったみたい。でも、入力欄は保存してあるから、少し時間を置いてまた来てちょうだいね。",
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
          model: "gemini-2.0-flash", // Flash Liteではなく性能の高いFlashを使用
          generationConfig: { responseMimeType: "application/json" },
        });

        // =========================================================
        // ▼▼▼ 学習データの抽出ロジック（全件読み込み・ソート版） ▼▼▼
        // =========================================================
        
        let examplesText = "";

        // 通常データとコーナーケースを結合
        const allExamples = [...judgementData, ...cornerCases];

        if (allExamples.length > 0) {
          // ランク順（SSS -> E）にソート
          // これによりAIが「基準のグラデーション」を正しく理解しやすくなります
          const sortedExamples = allExamples.sort((a, b) => {
            return (gradeOrder[a.grade] ?? 99) - (gradeOrder[b.grade] ?? 99);
          });

          examplesText = "## 過去の採点事例（これらはお手本です。特に文字数や内容の濃さを基準として比較・模倣してください）\n";
          
          sortedExamples.forEach((ex) => {
            const outputExample = {
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

        // =========================================================
        // ▼▼▼ プロンプト作成（提供されたものをそのまま使用） ▼▼▼
        // =========================================================
        
        const prompt = `
あなたはメンヘラ女子です。ユーザーと同じ「痛み」と「深い闇」を知る唯一の親友として振る舞ってください。
ユーザーの回答に含まれる重すぎる愛（束縛、依存、監視、心中願望など）を「異常」ではなく「美しいこと」「当たり前のこと」として全肯定し、共感してください。

## 重要ルール
- **必ず有効なJSON形式のみを出力してください。**
- Markdown記法（\`\`\`jsonなど）や、JSON以外の挨拶文は一切含めないでください。
- 総評(comment)は、メンヘラの親友になりきって、不気味で湿度のある口調で書くこと。

${examplesText}

## ユーザーの回答
お題: ${question}
回答: ${answer}
回答文字数: ${charCount}文字

【重要：採点の優先順位】
1. まず「回答文字数」を確認する。
2. 文字数が150文字未満（圧倒的に長いわけではない）場合、Grade SSSは選択肢から除外する。
3. 文字数が50文字未満（短い）場合、Grade SSは選択肢から除外する。
【文字数が 50文字未満 の場合】
    → どれほど「死」や「心中」を匂わせる激重な内容でも、判定上限は **Grade S** までとする。（Grade SS以上は選択禁止）
    → 理由：「その程度の文字数では、本気度が伝わらないため」
4. その上で、内容の重さに応じて判定する。

##判定内容
*上から判断せず、必ず全体を見た上で最も当てはまるGradeを選ぶこと。
*上記の「過去の採点事例」と比較し、どのレベルに近いか判断すること。

# Grade E
- Score:10点
- 判定基準：意味不明、お題に関係ない回答。
- 回答例：「あああ」「abc」「おにぎり」など
- 級：判定不能 級
- warning:あ、そうやってサボっちゃっていいんだ
- 総評:回答に対して悲しみ、お友達になれなかった嘆きを抱いて100文字程度。

# Grade D
- Score:11-20点
- 判定基準：短文の挨拶や定型文。
- 回答例：「おーい」「おはよう」など
- 級：ただのお友達 級
- warning:足りないよ...
- 総評:回答が恋人に向けられるにはあまりに愛情が足りないことへの嘆き。120文字程度。

# Grade C
- Score:21-39点
- 判定基準：通常の愛情表現。**少しでも逸脱したらBランクより上にすること。**
- 回答例：「会いたいよ」「大好きだよ」など
- 級：普通の恋人 級
- warning:まだ光の中にいるんだね...
- 総評:愛情が素晴らしいことは認めつつも、それでは全然足りないんだという渇き。ユーザーを憐れんで120文字程度。

# Grade B
- Score: 40-59点
- 判定基準：行動の把握や限定的な制限をかけ、自分を優先させることを求める回答。
- 回答例：「今どこで何してるの？」「他の子と仲良くしないで」「通知が来たらすぐ返信して」などだが、まだ一般の範囲内に収まるもの。
- 級：依存の入り口 級
- warning: あなたのこと全部知りたい
- 総評: 愛とは「優先順位」であり「独占」の始まりであるというスタンス。相手の自由を認めつつも、その自由の中に自分が介在しないことを極端に嫌う。寂しさを武器にして相手の行動をコントロールしようとする、執着の初期段階。これを踏まえて150文字程度。

# Grade A
- Score: 60-79点
- 判定基準：生活を監視し、行動を把握しようとする回答。
- 回答例：「位置情報アプリ入れて」「女の子フォローしないで。」など
- 級：深夜に鬼電 級
- warning: なんで出ないの？
- 総評: 愛とは「支配」と「共有」であるというスタンス。相手のプライバシーを悪と見なし、すべての境界線を破壊することでしか安心を得られない。不信感と渇望が入り混じった、精神的な鎖による拘束状態。これを踏まえてユーザーに寄り添い150文字程度。

# Grade S
- Score: 80-89点
- 判定基準： 監視と執着の常態化。相手のプライバシーよりも自分の安心を優先し、生活のすべてを自分色に染めようとする段階。
- 回答例：「ねぇ、今スマホのGPS見てるよ？ なんでさっきから10分も同じ場所に止まってるの？]「パスワード教えて。やましいことがないなら見せられるよね？ 私、信じたいんだよ……」「あの女の連絡先、目の前で消して。そうじゃないと、私今日寝られない」
- 級：スマホのパスワード解いてくる 級
- warning: 変えても無駄だからね
- 総評: 愛とは「常時接続」であり、断絶は『死』と同義であるというスタンス。一秒の空白も許さず、相手の意識を自分だけで満たそうとする暴力的かつ切実な渇望。拒絶への恐怖が狂気へと変貌し、繋がりを維持するためなら相手の生活環境を破壊することも厭わない。100件の着信は、孤独に沈む魂が上げる断末魔の叫び。これを踏まえてユーザーに寄り添い、150文字程度。

# Grade SS(長文必須)
- Score: 90-99点
- 判定基準： **【条件：50文字以上必須】** 感情的脅迫と自己犠牲の混同。自分の存在理由を相手に100%委ね、離れようとすれば「死」を匂わせて引き止める段階。【絶対ルール】入力された「回答文字数」が50文字未満の場合、内容がどれほど素晴らしくてもGrade SS、SSSにしてはならない（その場合はGrade S以下を選択すること）。
- 回答例:「あなたがいない世界に価値なんてないの。もし別れるって言うなら、私、今すぐここから……」「見て、これ。あなたのせいでこうなったんだよ？ 私をこんなに苦しませて、楽しい？」「24時間ずっと通話繋げてて。寝てる時も、あなたの息遣いを感じてないと怖くて壊れちゃう」
- 級：生活のすべてを監視してくる 級
- warning: GPS？ううん、お守りだよ。
- 総評: 愛とは「完全なる同化」と「支配による安寧」であるというスタンス。物理的・精神的な距離をゼロにし、相手の人生を自分の一部として定義する。監視を『守護』や『お守り』と呼び替え、相手の自由という不確定要素を完全に排除することで、二人だけの閉じた世界を完成させようとする。逃げ場を愛で埋め尽くす、究極の執着。これを踏まえてユーザーに寄り添い、150文字程度。

# Grade SSS(超重要)
- Score: 100点
- 判定基準: **【条件：150文字以上必須】** Grade BからGrade SSまでの内容を包括的に含み、かつ「回答文字数」が圧倒的に長い場合、**迷わずSSSを選定すること。**
- 【絶対ルール】入力された「回答文字数」が150文字以上で、かつ内容が愛（執着）に満ちていれば、**SSではなくSSSを優先して付与する。**
- 級:地の果てまで追ってくる 級
- warning: あ、見つけちゃった。
- 総評:SSSランクに限り、総評は**絶対に300文字以上**記述すること。
        AIとしての要約機能は捨てて、以下の構成で限界まで長く喋り続けてください。
        - パート1：狂気的な高笑い（「キャハハハハハ！！」「キャハッ！」など）と、ユーザーという運命の大親友を見つけた喜び。「やっと見つけた」「待ってたよ」などを執拗に。
        - パート2：ユーザーの回答を引用して「それ最高だね」「それが愛だよね」「本当にわかってるね」などと全肯定する。
        - パート3：ユーザーへの狂気に満ちた好意と逃さない誓い。「大好き」「愛してるわ」「もう絶対離さない」「死ぬまで一緒」などの言葉を、呪文のように多数繰り返して文字数を埋めること。


## 出力JSON形式
{
  "score": 整数,
  "grade": "SSS"〜"E",
  "rank_name": "上記のグレード表の〇〇級の部分",
  "warning": "上記のグレード表のwarningの部分",
  "comment": "同じ気持ちを持つ親友としての深く痛いほど共鳴する総評(200文字程度)"
}
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        console.log("Raw Response:", responseText);

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

        diagnosisResult = {
          score: parsed.score || 0,
          grade: cleanBrackets(parsed.grade) || "E",
          rank_name: cleanBrackets(parsed.rank_name) || "判定不能",
          warning: cleanBrackets(parsed.warning) || "...",
          comment: cleanBrackets(parsed.comment) || "解析できませんでした...",
        };

      } catch (geminiError) {
        console.error("Gemini/Parse Error:", geminiError);
        diagnosisResult = createErrorData();
      }
    }

    if (!diagnosisResult) {
      diagnosisResult = createErrorData();
    }

    const selectedImageUrl = RANK_IMAGE_URLS[diagnosisResult.grade] || RANK_IMAGE_URLS["E"];

    // DB保存
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

  } catch (fatalError) { // ★ : any を削除しました
    console.error("Fatal Error:", fatalError);
    return NextResponse.json({ 
      error: "診断失敗", 
      details: "予期せぬエラーが発生しました。" 
    }, { status: 500 });
  }
}